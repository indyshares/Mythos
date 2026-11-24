import type { ReactNode } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { VaultSetupScreen } from './VaultSetupScreen';

/** Shows the vault creation screen until at least one workspace exists. */
export function WorkspaceGate({ children }: { children: ReactNode }) {
  const { workspaces, nativeHydrated, t } = useWorkspace();

  if (!nativeHydrated) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-500">
        {t('common.loading')}
      </div>
    );
  }

  if (workspaces.length === 0) return <VaultSetupScreen />;
  return <>{children}</>;
}

export default WorkspaceGate;
