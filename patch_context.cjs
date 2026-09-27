const fs = require('fs');
const content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const target1 = "updateUserProfile: (profile: Partial<User>) => Promise<void>;";
const newTarget1 = target1 + "\n  updatePassword: (currentPassword: string, newPassword: string) => Promise<{success: boolean, error?: string}>;";

const target2 = "const updateUserProfile = async (profile: Partial<User>) => {";
const newTarget2 = `
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await apiFetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update password' };
      }
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Network error' };
    }
  };

  ` + target2;

const target3 = "deleteExpense, updateUserProfile,";
const newTarget3 = "deleteExpense, updateUserProfile, updatePassword,";

if (content.includes(target1) && content.includes(target2) && content.includes(target3)) {
  let newContent = content.replace(target1, newTarget1);
  newContent = newContent.replace(target2, newTarget2);
  newContent = newContent.replace(target3, newTarget3);
  fs.writeFileSync('src/context/AppContext.tsx', newContent);
  console.log('patched context');
} else {
  console.log('not found in context', {
    t1: content.includes(target1),
    t2: content.includes(target2),
    t3: content.includes(target3)
  });
}
