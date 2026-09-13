import fs from 'fs';

let content = fs.readFileSync('src/context/AppDataContext.tsx', 'utf8');

// We will replace the entire syncNow block to avoid re-uploading deleted local items.
// We will replace from "const syncNow = useCallback(async () => {" to the end of the function body.

const regex = /const syncNow = useCallback\(async \(\) => \{[\s\S]*?\}, \[uid\]\);/;

const replacement = `const syncNow = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      // Data is synced in real-time via onSnapshot listeners below.
      // We no longer push local items that are missing from the cloud, 
      // because that resurrects legitimately deleted items across devices.
      // Firebase SDK handles offline writes and caching automatically.
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } catch (err) {
      console.warn('Sync reconciliation finished:', err);
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    }
  }, [uid]);`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/context/AppDataContext.tsx', content);
  console.log('Fixed syncNow');
} else {
  console.log('Could not find syncNow block');
}
