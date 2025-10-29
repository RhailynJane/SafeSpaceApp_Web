import { useState, useEffect } from 'react';
import Sendbird from 'sendbird';
import { useUser } from '@clerk/nextjs';

const useSendbird = () => {
  const { user: clerkUser } = useUser();
  const [sb, setSb] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (clerkUser) {
      const newSb = new Sendbird({ appId: '201BD956-A3BA-448A-B8A2-8E1A23404303' });

      newSb.connect(clerkUser.id, (user, error) => {
        if (error) {
          console.error('Sendbird connection error:', error);
        } else {
          setUser(user);
        }
      });

      setSb(newSb);
    }
  }, [clerkUser]);

  return { sb, user };
};

export { useSendbird };