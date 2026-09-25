require('dotenv').config();
const { triageTicket, generateEmbedding } = require('./src/services/aiService');

async function testOpenAI() {
  console.log('Testing OpenAI Integration...');
  console.log(`Provider: ${process.env.AI_PROVIDER}`);
  console.log(`Key set: ${!!process.env.AI_API_KEY}`);

  try {
    const triageResult = await triageTicket('App is crashing on login', 'Every time I try to login, the app crashes and shows a red error screen. I am very frustrated with this garbage app.');
    console.log('\nTriage Result:');
    console.log(JSON.stringify(triageResult, null, 2));

    const embedding = await generateEmbedding('test embedding');
    console.log(`\nEmbedding generated successfully, length: ${embedding?.length}`);

    console.log('\n✅ OpenAI integration is working perfectly!');
  } catch (error) {
    console.error('\n❌ Error testing OpenAI:', error.message);
  }
}

testOpenAI();
