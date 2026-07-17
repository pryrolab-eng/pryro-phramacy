const { SignJWT } = require("jose");
const fs = require("fs");

const secret = new TextEncoder().encode("5e662ff1951fea1acf989bbe1664bca9d80b869f02ea806f133273e9799c9d49");

(async () => {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const token = await new SignJWT({ sid: "test-session-id" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("00000000-0000-0000-0000-000000000000")
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .setIssuedAt()
    .sign(secret);

  fs.writeFileSync("admin_session_cookie.txt", token);
  console.log("TOKEN:", token);
})();
