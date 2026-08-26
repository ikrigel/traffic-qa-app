export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    message: 'Microphone test endpoint',
    instructions: [
      'This is a backend endpoint that cannot test getUserMedia (browser API only)',
      'To test microphone access, use the browser console and run:',
      '',
      'navigator.mediaDevices.getUserMedia({ audio: true })',
      '  .then(() => console.log("✅ Microphone access granted"))',
      '  .catch(err => console.error("❌ Error:", err.name, err.message))',
      '',
      'Or check permission state with:',
      'navigator.permissions.query({ name: "microphone" })',
      '  .then(result => console.log("Permission state:", result.state))',
    ],
    timestamp: new Date().toISOString(),
  });
}
