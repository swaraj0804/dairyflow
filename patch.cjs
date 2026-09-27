const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const newEndpoint = `
app.put('/api/auth/password', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    const user = await db.select().from(users).where(eq(users.uid, uid));
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(currentPassword, user[0].password || '');
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.uid, uid));

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});
`;

const target = "app.put('/api/user/profile', requireAuth, async (req: AuthRequest, res) => {";
if (content.includes(target)) {
  const newContent = content.replace(target, newEndpoint + '\n' + target);
  fs.writeFileSync('server.ts', newContent);
  console.log('patched');
} else {
  console.log('not found');
}
