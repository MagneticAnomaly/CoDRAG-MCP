"""
Gold query evaluation runner for CoDRAG search quality.

Usage:
    python -m tests.eval.eval_runner --repo /path/to/codrag
    python -m tests.eval.eval_runner --repo /path/to/codrag --query gq-001
    python -m tests.eval.eval_runner --repo /path/to/codrag --verbose
"""

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add src to path
_SRC = Path(__file__).resolve().parent.parent.parent / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))


@dataclass
class QueryResult:
    """Result of evaluating a single gold query."""
    query_id: str
    query: str
    passed: bool
    file_hits: int
    file_misses: int
    keyword_hits: int
    keyword_misses: int
    top_k_files: List[str]
    expected_files: List[str]
    score: float
    details: str


def load_gold_queries(path: Optional[Path] = None) -> Dict[str, Any]:
    """Load gold queries from JSON file."""
    if path is None:
        path = Path(__file__).parent / "gold_queries.json"
    return json.loads(path.read_text())


def evaluate_query(
    index: "CodeIndex",
    query_spec: Dict[str, Any],
    k: int = 10,
    verbose: bool = False,
) -> QueryResult:
    """Evaluate a single gold query against the index."""
    query_id = query_spec["id"]
    query = query_spec["query"]
    expected_files = query_spec.get("expected_files", [])
    expected_keywords = query_spec.get("expected_keywords", [])
    
    # Run search
    results = index.search(query, k=k)
    
    # Extract file paths from results
    result_files = []
    result_content = []
    for r in results:
        doc = r.doc if hasattr(r, 'doc') else r
        sp = doc.get("source_path", "")
        result_files.append(sp)
        result_content.append(doc.get("content", ""))
    
    # Check file hits (any expected file in top-k results)
    file_hits = 0
    file_misses = 0
    for ef in expected_files:
        # Normalize expected file path
        ef_normalized = ef.replace("\\", "/")
        found = any(ef_normalized in rf or rf.endswith(ef_normalized.split("/")[-1]) for rf in result_files)
        if found:
            file_hits += 1
        else:
            file_misses += 1
    
    # Check keyword hits (any expected keyword in result content)
    keyword_hits = 0
    keyword_misses = 0
    combined_content = " ".join(result_content).lower()
    for kw in expected_keywords:
        if kw.lower() in combined_content:
            keyword_hits += 1
        else:
            keyword_misses += 1
    
    # Calculate score
    total_expected = len(expected_files) + len(expected_keywords)
    total_hits = file_hits + keyword_hits
    score = total_hits / total_expected if total_expected > 0 else 1.0
    
    # Determine pass/fail (>= 50% hits)
    passed = score >= 0.5
    
    # Build details string
    details_parts = []
    if file_misses > 0:
        missed = [ef for ef in expected_files if not any(ef in rf for rf in result_files)]
        details_parts.append(f"Missing files: {missed}")
    if keyword_misses > 0:
        missed_kw = [kw for kw in expected_keywords if kw.lower() not in combined_content]
        details_parts.append(f"Missing keywords: {missed_kw}")
    
    return QueryResult(
        query_id=query_id,
        query=query,
        passed=passed,
        file_hits=file_hits,
        file_misses=file_misses,
        keyword_hits=keyword_hits,
        keyword_misses=keyword_misses,
        top_k_files=result_files[:5],
        expected_files=expected_files,
        score=score,
        details="; ".join(details_parts) if details_parts else "All expectations met",
    )


def run_evaluation(
    repo_root: Path,
    query_ids: Optional[List[str]] = None,
    k: int = 10,
    verbose: bool = False,
) -> List[QueryResult]:
    """Run evaluation on gold queries."""
    from codrag.core import CodeIndex, FakeEmbedder, OllamaEmbedder
    
    # Load gold queries
    gold = load_gold_queries()
    queries = gold["queries"]
    
    # Filter by query IDs if specified
    if query_ids:
        queries = [q for q in queries if q["id"] in query_ids]
    
    if not queries:
        print("No queries to evaluate")
        return []
    
    # Find or create index
    index_dir = repo_root / ".codrag" / "index"
    
    # Try to use real embedder, fall back to fake
    try:
        embedder = OllamaEmbedder()
        # Quick connectivity check
        embedder.embed("test")
    except Exception:
        print("Warning: Ollama not available, using FakeEmbedder (results will be random)")
        embedder = FakeEmbedder()
    
    index = CodeIndex(index_dir=index_dir, embedder=embedder)
    
    if not index.is_loaded():
        print(f"Index not found at {index_dir}")
        print("Building index... (this may take a while)")
        index.build(repo_root=repo_root)
    
    # Run evaluations
    results = []
    for query_spec in queries:
        result = evaluate_query(index, query_spec, k=k, verbose=verbose)
        results.append(result)
        
        # Print result
        status = "✓ PASS" if result.passed else "✗ FAIL"
        print(f"{status} [{result.query_id}] {result.query}")
        print(f"       Score: {result.score:.1%} | Files: {result.file_hits}/{result.file_hits + result.file_misses} | Keywords: {result.keyword_hits}/{result.keyword_hits + result.keyword_misses}")
        
        if verbose or not result.passed:
            print(f"       Top files: {result.top_k_files[:3]}")
            if result.details != "All expectations met":
                print(f"       Details: {result.details}")
        print()
    
    return results


def print_summary(results: List[QueryResult]) -> None:
    """Print evaluation summary."""
    if not results:
        return
    
    passed = sum(1 for r in results if r.passed)
    total = len(results)
    avg_score = sum(r.score for r in results) / total
    
    print("=" * 60)
    print(f"SUMMARY: {passed}/{total} queries passed ({passed/total:.0%})")
    print(f"Average score: {avg_score:.1%}")
    
    # Group by category
    by_category: Dict[str, List[QueryResult]] = {}
    gold = load_gold_queries()
    for q in gold["queries"]:
        cat = q.get("category", "unknown")
        qid = q["id"]
        for r in results:
            if r.query_id == qid:
                by_category.setdefault(cat, []).append(r)
    
    print("\nBy category:")
    for cat, cat_results in sorted(by_category.items()):
        cat_passed = sum(1 for r in cat_results if r.passed)
        cat_total = len(cat_results)
        print(f"  {cat}: {cat_passed}/{cat_total}")


def main():
    parser = argparse.ArgumentParser(description="Evaluate CoDRAG search quality")
    parser.add_argument("--repo", type=Path, required=True, help="Repository root path")
    parser.add_argument("--query", type=str, action="append", help="Specific query ID(s) to run")
    parser.add_argument("--k", type=int, default=10, help="Number of search results")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    if not args.repo.exists():
        print(f"Error: Repository path does not exist: {args.repo}")
        sys.exit(1)
    
    print(f"Evaluating against: {args.repo}")
    print(f"Search k={args.k}")
    print()
    
    results = run_evaluation(
        repo_root=args.repo,
        query_ids=args.query,
        k=args.k,
        verbose=args.verbose,
    )
    
    print_summary(results)
    
    # Exit with error if any failed
    if any(not r.passed for r in results):
        sys.exit(1)


if __name__ == "__main__":
    main()
