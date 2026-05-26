import bcrypt from 'bcryptjs';

const hash = '$2b$12$r4netMpaqnI2IPKROfLRlegb0Xmz7rqUN4PsCZt49kliZ5UXd0BA.';
const passwordsToTry = ['Admin@123', 'admin@123', 'admin', 'Admin123', 'Admin@1234'];

async function main() {
  for (const pw of passwordsToTry) {
    const match = await bcrypt.compare(pw, hash);
    console.log(`Senha '${pw}': ${match ? 'CORRETA ✅' : 'INCORRETA ❌'}`);
  }
}

main();
