// components/help/sections/OverviewSection.tsx
import { HelpHeader } from "../HelpHeader";
import { VersionInfo } from "../VersionInfo";

interface OverviewSectionProps {
  installedVersion: string | null;

  latest: {
    version: string;
    platforms: {
      [key: string]: {
        url: string;
      };
    };
  };
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  installedVersion,
  latest,
}) => {
  const downloadUrl = latest.platforms["windows-x86_64"].url;
  const filename = downloadUrl.split("/").pop();

  return (
    <section id="overview" className="mb-12">
      <HelpHeader
        title="Help & Support Center"
        description="Welcome to the Customer Service Application help center. Find manuals, troubleshooting guides, and support resources tailored to your role."
      />

      <VersionInfo
        installedVersion={installedVersion}
        latestVersion={latest.version}
        downloadUrl={downloadUrl}
        filename={filename ? filename : "Not-available!"}
      />
    </section>
  );
};
