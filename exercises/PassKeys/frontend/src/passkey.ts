export async function createPasskey() {
  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge: Uint8Array.from("random-challenge-string", c => c.charCodeAt(0)),
    rp: { name: "Passkey AA Dapp" },
    user: {
      id: Uint8Array.from(crypto.randomUUID(), c => c.charCodeAt(0)),
      name: "user@example.com",
      displayName: "User",
    },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    authenticatorSelection: { userVerification: "preferred" },
    timeout: 60000,
    attestation: "direct",
  };

  const credential = await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions,
  });

  console.log("Credential created:", credential);

  return credential;
}

export async function signWithPasskey(credentialId: string, challenge: string) {
  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: Uint8Array.from(challenge, c => c.charCodeAt(0)),
    allowCredentials: [{
      id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
      type: "public-key",
    }],
    userVerification: "preferred",
    timeout: 60000,
  };

  const assertion = await navigator.credentials.get({
    publicKey: publicKeyCredentialRequestOptions,
  });

  console.log("Assertion:", assertion);

  return assertion;
}
