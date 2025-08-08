// Quick test script for Gemini AI integration
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';

// Load environment variables manually
const envContent = readFileSync('apps/web/.env.local', 'utf8');
const envLines = envContent.split('\n');
const envVars = {};
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key] = valueParts.join('=');
  }
});
process.env = { ...process.env, ...envVars };

async function testGeminiIntegration() {
  console.log('🧪 Testing Neuroleaf AI Integration...\n');

  // Check if API key is present
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    process.exit(1);
  }

  console.log('✅ Gemini API key found');

  try {
    // Initialize Gemini client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log('✅ Gemini client initialized');

    // Test simple generation
    const prompt = `Create a simple flashcard about the solar system. 
    Respond in JSON format: {"front": "question", "back": "answer"}`;

    console.log('🔄 Testing flashcard generation...');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ AI Response received:');
    console.log('📝 Generated content:', text);

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
      console.log('✅ Successfully parsed JSON flashcard:');
      console.log('   Front:', parsed.front);
      console.log('   Back:', parsed.back);
    } catch (e) {
      console.log('⚠️  Response is not valid JSON, but AI is working');
    }

    console.log('\n🎉 Neuroleaf AI integration is working correctly!');
    console.log('\nNext steps:');
    console.log('1. Start Docker Desktop');
    console.log('2. Run: pnpm run supabase:web:reset');
    console.log('3. Run: pnpm run dev');
    console.log('4. Visit: http://localhost:3000');

  } catch (error) {
    console.error('❌ Error testing Gemini integration:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('💡 Check that your Gemini API key is valid and active');
    } else if (error.message.includes('quota')) {
      console.error('💡 You may have exceeded your API quota');
    }
    
    process.exit(1);
  }
}

testGeminiIntegration();