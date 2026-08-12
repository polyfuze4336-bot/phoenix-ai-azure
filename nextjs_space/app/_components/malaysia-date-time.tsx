'use client';

import { useEffect, useState } from 'react';

const formatter = new Intl.DateTimeFormat('en-MY', {
  timeZone: 'Asia/Kuala_Lumpur',
  dateStyle: 'medium',
  timeStyle: 'medium',
});

export function MalaysiaDateTime() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());

    updateTime();
    const timer = window.setInterval(updateTime, 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (!currentTime) {
    return null;
  }

  return (
    <time dateTime={currentTime.toISOString()} suppressHydrationWarning>
      Malaysia time: {formatter.format(currentTime)}
    </time>
  );
}