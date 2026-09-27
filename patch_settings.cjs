const fs = require('fs');
const content = fs.readFileSync('src/views/SettingsView.tsx', 'utf8');

const target = "const { user, updateUserProfile, signOut, milkInward, expenses, customers } = useApp();";
const newTarget = "const { user, updateUserProfile, signOut, milkInward, expenses, customers, updatePassword } = useApp();";

const oldHandleChangePassword = `  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    setIsChangingPassword(true);
    // Simulating API call
    setTimeout(() => {
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert("Password updated successfully!");
      setActiveView('privacy');
    }, 800);
  };`;

const newHandleChangePassword = `  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    setIsChangingPassword(true);
    
    const result = await updatePassword(currentPassword, newPassword);
    
    setIsChangingPassword(false);
    
    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert("Password updated successfully!");
      setActiveView('privacy');
    } else {
      alert(result.error || "Failed to update password");
    }
  };`;

if (content.includes(target) && content.includes(oldHandleChangePassword)) {
  let newContent = content.replace(target, newTarget);
  newContent = newContent.replace(oldHandleChangePassword, newHandleChangePassword);
  fs.writeFileSync('src/views/SettingsView.tsx', newContent);
  console.log('patched settings');
} else {
  console.log('not found in settings', {
    t: content.includes(target),
    old: content.includes(oldHandleChangePassword)
  });
}
