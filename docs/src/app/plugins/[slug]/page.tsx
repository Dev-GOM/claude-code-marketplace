import { notFound } from 'next/navigation';
import { getPluginBySlug, getAllPlugins } from '@/lib/data/plugins';
import { PluginDetailHeader } from '@/components/PluginDetailHeader';
import { PluginDetailReadme } from '@/components/PluginDetailReadme';
import { PluginDetailInstall } from '@/components/PluginDetailInstall';

interface PageProps {
  readonly params: Promise<{
    readonly slug: string;
  }>;
}

export function generateStaticParams() {
  const plugins = getAllPlugins();
  return plugins.map((plugin) => ({
    slug: plugin.slug,
  }));
}

export default async function PluginDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const plugin = getPluginBySlug(slug);

  if (!plugin) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <PluginDetailHeader plugin={plugin} />
      <PluginDetailReadme plugin={plugin} />
      <PluginDetailInstall plugin={plugin} />
    </div>
  );
}
