// pages/index.js
import { useState } from 'react';

export default function Home() {
  const [mode, setMode] = useState('human'); // 'human' | 'animal' | 'cartoon'
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, ...form })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const imageSrc = result?.image?.url
    ? result.image.url
    : result?.image?.base64
    ? `data:image/png;base64,${result.image.base64}`
    : null;

  const download = () => {
    if (!imageSrc) return;
    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = `tae-${mode}.png`;
    a.click();
  };

  return (
    <main style={{ maxWidth: 860, margin: '32px auto', padding: 16 }}>
      <h1>Create your custom character</h1>
      <p style={{ opacity: 0.8 }}>Choose Human / Animal / Cartoon. All images use a white studio background.</p>

      {/* Mode switch */}
      <div style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
        {['human', 'animal', 'cartoon'].map((m) => (
          <label key={m} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="radio"
              name="mode"
              value={m}
              checked={mode === m}
              onChange={(e) => { setMode(e.target.value); setForm({}); setResult(null); setError(''); }}
            />
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </label>
        ))}
      </div>

      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        {mode !== 'animal' ? (
          <>
            <input name="gender" placeholder="Gender" onChange={onChange} />
            <input name="hair" placeholder="Hair colour" onChange={onChange} />
            <input name="hairType" placeholder="Hair type (curly, straight…)" onChange={onChange} />
            <input name="skin" placeholder="Skin tone" onChange={onChange} />
            <input name="age" placeholder="Age" onChange={onChange} />
            <input name="build" placeholder="Build (slim, athletic…)" onChange={onChange} />
            <input name="height" placeholder="Height (e.g., 180cm)" onChange={onChange} />
            <input name="outfit" placeholder="Outfit" onChange={onChange} />
            <input name="personality" placeholder="Personality (calm, confident, chaotic…)" onChange={onChange} />
          </>
        ) : (
          <>
            <input name="animalType" placeholder="Animal (e.g., rabbit, dog, fox)" onChange={onChange} />
            <input name="clothesTop" placeholder="Top (e.g., hoodie)" onChange={onChange} />
            <input name="clothesBottom" placeholder="Bottom (e.g., jeans)" onChange={onChange} />
            <input name="shoes" placeholder="Shoes (e.g., sneakers)" onChange={onChange} />
            <input name="themeColour" placeholder="Theme colour (e.g., blue)"
