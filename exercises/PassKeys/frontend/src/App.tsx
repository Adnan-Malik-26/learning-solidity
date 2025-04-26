import { useState } from 'react';
import { createPasskey, signWithPasskey } from './passkey';
import './App.css';

function App() {
  const [credentialId, setCredentialId] = useState<string>('');

  const handleCreate = async () => {
    const credential = await createPasskey();
    if (credential) {
      const id = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      setCredentialId(id);
      alert('Passkey created and credential ID saved!');
    }
  };

  const handleSign = async () => {
    if (!credentialId) {
      alert('First create a passkey!');
      return;
    }
    const assertion = await signWithPasskey(credentialId, 'sign-this-challenge');
    console.log('Signed assertion:', assertion);
    alert('Signature created! Check console.');
  };

  return (
    <div className="App">
      <h1>Passkey AA Demo</h1>
      <button onClick={handleCreate}>Create Passkey</button>
      <button onClick={handleSign} style={{ marginLeft: '10px' }}>Sign with Passkey</button>
    </div>
  );
}

export default App;

