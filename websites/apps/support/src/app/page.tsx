import { getRecentDiscussions } from '../lib/github';
import { DiscussionList } from '../components/DiscussionList';
import { SupportFeatures } from '../components/SupportFeatures';

// Revalidate GitHub data every 60 seconds
export const revalidate = 60;

export default async function Page() {
  const discussions = await getRecentDiscussions(5);

  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Support Center</h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto">
            Get help with setup, troubleshoot builds, report issues, or reach the team directly.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mb-16">
          <SupportFeatures />
        </div>

        {/* Community Discussions Section */}
        <div className="max-w-4xl mx-auto">
          <DiscussionList discussions={discussions} />
        </div>
      </div>
    </main>
  );
}
