// components/help/VersionInfo.tsx
import { FiAlertTriangle, FiDownload } from "react-icons/fi";

interface VersionInfoProps {
  installedVersion: string | null;
  latestVersion: string;
  downloadUrl: string;
  filename: string;
}

export const VersionInfo: React.FC<VersionInfoProps> = ({
  installedVersion,
  latestVersion,
  downloadUrl,
  filename,
}) => {
  const isUpdateAvailable =
    installedVersion && installedVersion !== latestVersion;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {installedVersion && (
          <div>
            <p className="text-gray-700 dark:text-gray-200">
              Installed Version:{" "}
              <strong className="text-green-600">{installedVersion}</strong>
            </p>
          </div>
        )}
        <div>
          <p className="text-gray-700 dark:text-gray-200">
            Latest Version:{" "}
            <strong className="text-blue-600">{latestVersion}</strong>
          </p>
        </div>
      </div>

      {isUpdateAvailable && (
        <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 rounded">
          <div className="flex items-center">
            <FiAlertTriangle className="inline mr-2 text-yellow-600" />
            <span>A new version is available! Download it below.</span>
          </div>
        </div>
      )}

      <a
        href={downloadUrl}
        className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
        download={filename}
      >
        <FiDownload className="mr-2" />
        💾 Download {filename}
      </a>
    </div>
  );
};
