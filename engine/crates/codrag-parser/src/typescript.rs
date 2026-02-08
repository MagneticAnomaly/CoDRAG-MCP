//! TypeScript/JavaScript AST analyzer using tree-sitter.
//!
//! Extracts: functions, classes, interfaces, type aliases, imports/exports.

use tree_sitter::{Language, Parser, Node};

use crate::{
    stable_edge_id, stable_external_module_id, stable_file_node_id, stable_symbol_node_id,
    EdgeMetadata, NodeMetadata, ParseResult, ParsedEdge, ParsedNode, ParserError,
    Span,
};

fn get_ts_language() -> Language {
    tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into()
}

fn get_js_language() -> Language {
    tree_sitter_javascript::LANGUAGE.into()
}

/// Analyze a TypeScript or JavaScript file.
pub fn analyze(
    file_path: &str,
    content: &str,
    language: &str,
) -> Result<ParseResult, ParserError> {
    let mut parser = Parser::new();
    let lang = if language == "typescript" || file_path.ends_with(".ts") || file_path.ends_with(".tsx") {
        get_ts_language()
    } else {
        get_js_language()
    };

    parser
        .set_language(&lang)
        .map_err(|e| ParserError::LanguageInit(format!("TS/JS: {}", e)))?;

    let tree = parser.parse(content, None).ok_or_else(|| ParserError::ParseFailed {
        path: file_path.to_string(),
        message: "tree-sitter parse returned None".to_string(),
    })?;

    let root = tree.root_node();
    let source = content.as_bytes();
    let file_node_id = stable_file_node_id(file_path);
    let lang_str = language.to_string();

    let mut result = ParseResult::empty();

    let mut cursor = root.walk();
    for child in root.children(&mut cursor) {
        extract_top_level(&child, source, file_path, &file_node_id, &lang_str, &mut result);
    }

    Ok(result)
}

fn node_text<'a>(node: &Node, source: &'a [u8]) -> &'a str {
    node.utf8_text(source).unwrap_or("")
}

fn extract_top_level(
    node: &Node,
    source: &[u8],
    file_path: &str,
    file_node_id: &str,
    language: &str,
    result: &mut ParseResult,
) {
    match node.kind() {
        "function_declaration" | "generator_function_declaration" => {
            extract_function(node, source, file_path, file_node_id, language, None, result);
        }
        "class_declaration" => {
            extract_class(node, source, file_path, file_node_id, language, result);
        }
        "interface_declaration" => {
            extract_interface(node, source, file_path, file_node_id, language, result);
        }
        "type_alias_declaration" => {
            extract_type_alias(node, source, file_path, file_node_id, language, result);
        }
        "enum_declaration" => {
            extract_enum(node, source, file_path, file_node_id, language, result);
        }
        "import_statement" => {
            extract_import(node, source, file_path, file_node_id, result);
        }
        "export_statement" => {
            // Recurse into exported declarations
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                extract_top_level(&child, source, file_path, file_node_id, language, result);
            }
        }
        "lexical_declaration" => {
            // const/let/var with arrow functions or class expressions
            extract_lexical_functions(node, source, file_path, file_node_id, language, result);
        }
        _ => {}
    }
}

fn extract_function(
    node: &Node,
    source: &[u8],
    file_path: &str,
    file_node_id: &str,
    language: &str,
    parent_qualname: Option<&str>,
    result: &mut ParseResult,
) {
    let name = node
        .child_by_field_name("name")
        .map(|n| node_text(&n, source))
        .unwrap_or("");

    if name.is_empty() {
        return;
    }

    let start_line = node.start_position().row + 1;
    let end_line = node.end_position().row + 1;

    let qualname = match parent_qualname {
        Some(parent) => format!("{}.{}", parent, name),
        None => name.to_string(),
    };

    let is_async = node.kind().contains("async") || {
        let mut found = false;
        for i in 0..node.child_count() {
            if let Some(ch) = node.child(i) {
                if node_text(&ch, source) == "async" {
                    found = true;
                    break;
                }
            }
        }
        found
    };

    let symbol_type = if parent_qualname.is_some() {
        if is_async { "async_method" } else { "method" }
    } else if node.kind().contains("generator") {
        "generator_function"
    } else if is_async {
        "async_function"
    } else {
        "function"
    };

    let is_public = !name.starts_with('_');

    let node_id = stable_symbol_node_id(&qualname, file_path, start_line);

    result.nodes.push(ParsedNode {
        id: node_id.clone(),
        kind: "symbol".to_string(),
        name: name.to_string(),
        file_path: file_path.to_string(),
        span: Some(Span { start_line, end_line }),
        language: Some(language.to_string()),
        metadata: NodeMetadata {
            symbol_type: Some(symbol_type.to_string()),
            qualname: Some(qualname),
            is_async: Some(is_async),
            is_public: Some(is_public),
            ..Default::default()
        },
    });

    let edge_id = stable_edge_id("contains", file_node_id, &node_id, "");
    result.edges.push(ParsedEdge {
        id: edge_id,
        kind: "contains".to_string(),
        source: file_node_id.to_string(),
        target: node_id,
        metadata: EdgeMetadata {
            confidence: 1.0,
            ..Default::default()
        },
    });
}

fn extract_class(
    node: &Node,
    source: &[u8],
    file_path: &str,
    file_node_id: &str,
    language: &str,
    result: &mut ParseResult,
) {
    let name = node
        .child_by_field_name("name")
        .map(|n| node_text(&n, source))
        .unwrap_or("");

    if name.is_empty() {
        return;
    }

    let start_line = node.start_position().row + 1;
    let end_line = node.end_position().row + 1;
    let qualname = name.to_string();

    let node_id = stable_symbol_node_id(&qualname, file_path, start_line);

    result.nodes.push(ParsedNode {
        id: node_id.clone(),
        kind: "symbol".to_string(),
        name: name.to_string(),
        file_path: file_path.to_string(),
        span: Some(Span { start_line, end_line }),
        language: Some(language.to_string()),
        metadata: NodeMetadata {
            symbol_type: Some("class".to_string()),
            qualname: Some(qualname.clone()),
            is_public: Some(!name.starts_with('_')),
            ..Default::default()
        },
    });

    let edge_id = stable_edge_id("contains", file_node_id, &node_id, "");
    result.edges.push(ParsedEdge {
        id: edge_id,
        kind: "contains".to_string(),
        source: file_node_id.to_string(),
        target: node_id,
        metadata: EdgeMetadata {
            confidence: 1.0,
            ..Default::default()
        },
    });

    // Extract methods from class body
    if let Some(body) = node.child_by_field_name("body") {
        let mut cursor = body.walk();
        for child in body.children(&mut cursor) {
            if child.kind() == "method_definition" {
                extract_function(&child, source, file_path, file_node_id, language, Some(&qualname), result);
            }
        }
    }
}

fn extract_interface(
    node: &Node,
    source: &[u8],
    file_path: &str,
    file_node_id: &str,
    language: &str,
    result: &mut ParseResult,
) {
    let name = node
        .child_by_field_name("name")
        .map(|n| node_text(&n, source))
        .unwrap_or("");

    if name.is_empty() {
        return;
    }

    let start_line = node.start_position().row + 1;
    let end_line = node.end_position().row + 1;

    let node_id = stable_symbol_node_id(name, file_path, start_line);

    result.nodes.push(ParsedNode {
        id: node_id.clone(),
        kind: "symbol".to_string(),
        name: name.to_string(),
        file_path: file_path.to_string(),
        span: Some(Span { start_line, end_line }),
        language: Some(language.to_string()),
        metadata: NodeMetadata {
            symbol_type: Some("interface".to_string()),
            qualname: Some(name.to_string()),
            is_public: Some(true),
            ..Default::default()
        },
    });

    let edge_id = stable_edge_id("contains", file_node_id, &node_id, "");
    result.edges.push(ParsedEdge {
        id: edge_id,
        kind: "contains".to_string(),
        source: file_node_id.to_string(),
        target: node_id,
        metadata: EdgeMetadata {
            confidence: 1.0,
            ..Default::default()
        },
    });
}

fn extract_type_alias(
    node: &Node,
    source: &[u8],
    file_path: &str,
    file_node_id: &str,
    language: &str,
    result: &mut ParseResult,
) {
    let name = node
        .child_by_field_name("name")
        .map(|n| node_text(&n, source))
        .unwrap_or("");

    if name.is_empty() {
        return;
    }

    let start_line = node.start_position().row + 1;
    let end_line = node.end_position().row + 1;

    let node_id = stable_symbol_node_id(name, file_path, start_line);

    result.nodes.push(ParsedNode {
        id: node_id.clone(),
        kind: "symbol".to_string(),
        name: name.to_string(),
        file_path: file_path.to_string(),
        span: Some(Span { start_line, end_line }),
        language: Some(language.to_string()),
        metadata: NodeMetadata {
            symbol_type: Some("type_alias".to_string()),
            qualname: Some(name.to_string()),
            is_public: Some(true),
            ..Default::default()
        },
    });

    let edge_id = stable_edge_id("contains", file_node_id, &node_id, "");
    result.edges.push(ParsedEdge {
        id: edge_id,
        kind: "contains".to_string(),
        source: file_node_id.to_string(),
        target: node_id,
        metadata: EdgeMetadata {
            confidence: 1.0,
            ..Default::default()
        },
    });
}

fn extract_enum(
    node: &Node,
    source: &[u8],
    file_path: &str,
    file_node_id: &str,
    language: &str,
    result: &mut ParseResult,
) {
    let name = node
        .child_by_field_name("name")
        .map(|n| node_text(&n, source))
        .unwrap_or("");

    if name.is_empty() {
        return;
    }

    let start_line = node.start_position().row + 1;
    let end_line = node.end_position().row + 1;

    let node_id = stable_symbol_node_id(name, file_path, start_line);

    result.nodes.push(ParsedNode {
        id: node_id.clone(),
        kind: "symbol".to_string(),
        name: name.to_string(),
        file_path: file_path.to_string(),
        span: Some(Span { start_line, end_line }),
        language: Some(language.to_string()),
        metadata: NodeMetadata {
            symbol_type: Some("enum".to_string()),
            qualname: Some(name.to_string()),
            is_public: Some(true),
            ..Default::default()
        },
    });

    let edge_id = stable_edge_id("contains", file_node_id, &node_id, "");
    result.edges.push(ParsedEdge {
        id: edge_id,
        kind: "contains".to_string(),
        source: file_node_id.to_string(),
        target: node_id,
        metadata: EdgeMetadata {
            confidence: 1.0,
            ..Default::default()
        },
    });
}

fn extract_lexical_functions(
    node: &Node,
    source: &[u8],
    file_path: &str,
    file_node_id: &str,
    language: &str,
    result: &mut ParseResult,
) {
    // Handle: const foo = () => {}, const foo = function() {}
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if child.kind() == "variable_declarator" {
            let name = child
                .child_by_field_name("name")
                .map(|n| node_text(&n, source))
                .unwrap_or("");

            let value = child.child_by_field_name("value");
            if let Some(val) = value {
                if val.kind() == "arrow_function" || val.kind() == "function" {
                    if !name.is_empty() {
                        let start_line = node.start_position().row + 1;
                        let end_line = node.end_position().row + 1;

                        let is_async = {
                            let mut found = false;
                            for i in 0..val.child_count() {
                                if let Some(ch) = val.child(i) {
                                    if node_text(&ch, source) == "async" {
                                        found = true;
                                        break;
                                    }
                                }
                            }
                            found
                        };

                        let symbol_type = if is_async { "async_function" } else { "function" };

                        let node_id = stable_symbol_node_id(name, file_path, start_line);

                        result.nodes.push(ParsedNode {
                            id: node_id.clone(),
                            kind: "symbol".to_string(),
                            name: name.to_string(),
                            file_path: file_path.to_string(),
                            span: Some(Span { start_line, end_line }),
                            language: Some(language.to_string()),
                            metadata: NodeMetadata {
                                symbol_type: Some(symbol_type.to_string()),
                                qualname: Some(name.to_string()),
                                is_async: Some(is_async),
                                is_public: Some(!name.starts_with('_')),
                                ..Default::default()
                            },
                        });

                        let edge_id = stable_edge_id("contains", file_node_id, &node_id, "");
                        result.edges.push(ParsedEdge {
                            id: edge_id,
                            kind: "contains".to_string(),
                            source: file_node_id.to_string(),
                            target: node_id,
                            metadata: EdgeMetadata {
                                confidence: 1.0,
                                ..Default::default()
                            },
                        });
                    }
                }
            }
        }
    }
}

fn extract_import(
    node: &Node,
    source: &[u8],
    _file_path: &str,
    file_node_id: &str,
    result: &mut ParseResult,
) {
    let line = node.start_position().row + 1;

    // Find the source string (the import path)
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if child.kind() == "string" {
            let raw = node_text(&child, source);
            let module = raw.trim_matches(|c| c == '\'' || c == '"');

            if !module.is_empty() {
                let ext_id = stable_external_module_id(module);
                let disambiguator = format!("{}:{}", module, line);
                let edge_id = stable_edge_id("imports", file_node_id, &ext_id, &disambiguator);

                result.nodes.push(ParsedNode {
                    id: ext_id.clone(),
                    kind: "external_module".to_string(),
                    name: module.to_string(),
                    file_path: String::new(),
                    span: None,
                    language: None,
                    metadata: NodeMetadata {
                        external: Some(true),
                        ..Default::default()
                    },
                });

                result.edges.push(ParsedEdge {
                    id: edge_id,
                    kind: "imports".to_string(),
                    source: file_node_id.to_string(),
                    target: ext_id,
                    metadata: EdgeMetadata {
                        confidence: 0.5,
                        import_str: Some(module.to_string()),
                        line: Some(line),
                        external: Some(true),
                        ..Default::default()
                    },
                });
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse_ts(code: &str) -> ParseResult {
        analyze("test.ts", code, "typescript").unwrap()
    }

    fn parse_js(code: &str) -> ParseResult {
        analyze("test.js", code, "javascript").unwrap()
    }

    #[test]
    fn test_ts_function() {
        let result = parse_ts("function hello(): void {}\n");
        assert_eq!(result.nodes.len(), 1);
        assert_eq!(result.nodes[0].name, "hello");
        assert_eq!(result.nodes[0].metadata.symbol_type.as_deref(), Some("function"));
    }

    #[test]
    fn test_ts_class() {
        let result = parse_ts("class MyComponent {\n  render() {}\n}\n");
        let class_node = result.nodes.iter().find(|n| n.name == "MyComponent").unwrap();
        assert_eq!(class_node.metadata.symbol_type.as_deref(), Some("class"));
    }

    #[test]
    fn test_ts_interface() {
        let result = parse_ts("interface Props {\n  name: string;\n}\n");
        assert_eq!(result.nodes.len(), 1);
        assert_eq!(result.nodes[0].name, "Props");
        assert_eq!(result.nodes[0].metadata.symbol_type.as_deref(), Some("interface"));
    }

    #[test]
    fn test_ts_import() {
        let result = parse_ts("import { foo } from './bar';\n");
        let import_edges: Vec<_> = result.edges.iter().filter(|e| e.kind == "imports").collect();
        assert_eq!(import_edges.len(), 1);
    }

    #[test]
    fn test_js_arrow_function() {
        let result = parse_js("const greet = () => {};\n");
        assert_eq!(result.nodes.len(), 1);
        assert_eq!(result.nodes[0].name, "greet");
        assert_eq!(result.nodes[0].metadata.symbol_type.as_deref(), Some("function"));
    }

    #[test]
    fn test_ts_enum() {
        let result = parse_ts("enum Direction {\n  Up,\n  Down,\n}\n");
        assert_eq!(result.nodes.len(), 1);
        assert_eq!(result.nodes[0].name, "Direction");
        assert_eq!(result.nodes[0].metadata.symbol_type.as_deref(), Some("enum"));
    }
}
