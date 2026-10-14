import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppProvider, useApp } from '../app/AppContext';
import type { Schedule } from '../domain/model';
import type { AppConfig, Ports } from '../ports';
import { DesktopView } from './desktop/DesktopView';
import { MobileView } from './mobile/MobileView';

function Screen() {
  const { layout } = useApp();
  return layout.mode === 'mobile' ? <MobileView /> : <DesktopView />;
}

export function App({ ports, config }: { ports: Ports; config: AppConfig }) {
  const { t } = useTranslation();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  useEffect(() => {
    let alive = true;
    void ports.backend.load().then((s) => alive && setSchedule(s));
    return () => {
      alive = false;
    };
  }, [ports]);
  if (!schedule) return <p className="loading" role="status">{t('loading')}</p>;
  return (
    <AppProvider schedule={schedule} ports={ports} config={config}>
      <Screen />
    </AppProvider>
  );
}
