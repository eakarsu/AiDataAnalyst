import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(messages, model = OPENROUTER_MODEL) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'AI Data Analyst'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function generateInsight(data, context) {
  const messages = [
    {
      role: 'system',
      content: 'You are an expert data analyst AI. Analyze the provided data and generate actionable business insights. Be specific, quantitative, and provide clear recommendations. Format your response as JSON with fields: title, insight_type (opportunity/risk/trend/anomaly/optimization), content, confidence (0-100), impact (high/medium/low), recommendations (array of strings).'
    },
    {
      role: 'user',
      content: `Analyze this data and provide insights:\n\nContext: ${context}\n\nData: ${JSON.stringify(data)}`
    }
  ];

  const response = await callOpenRouter(messages);
  try {
    return JSON.parse(response);
  } catch {
    return {
      title: 'Data Analysis Insight',
      insight_type: 'trend',
      content: response,
      confidence: 85,
      impact: 'medium',
      recommendations: ['Review the analysis for actionable items']
    };
  }
}

export async function generateSQLFromNaturalLanguage(query, schema) {
  const messages = [
    {
      role: 'system',
      content: `You are an expert SQL developer. Convert natural language queries to SQL. The database uses PostgreSQL. Here is the schema:\n${schema}\n\nRespond with only the SQL query, no explanations.`
    },
    {
      role: 'user',
      content: query
    }
  ];

  return await callOpenRouter(messages);
}

export async function analyzeAnomaly(metric, expected, actual, historicalData) {
  const messages = [
    {
      role: 'system',
      content: 'You are an anomaly detection expert. Analyze the data deviation and provide insights. Format response as JSON with fields: severity (critical/high/medium/low), possibleCauses (array), recommendations (array), requiresAction (boolean).'
    },
    {
      role: 'user',
      content: `Metric: ${metric}\nExpected Value: ${expected}\nActual Value: ${actual}\nDeviation: ${((actual - expected) / expected * 100).toFixed(2)}%\nHistorical Data: ${JSON.stringify(historicalData)}`
    }
  ];

  const response = await callOpenRouter(messages);
  try {
    return JSON.parse(response);
  } catch {
    return {
      severity: Math.abs((actual - expected) / expected) > 0.5 ? 'high' : 'medium',
      possibleCauses: ['Requires further investigation'],
      recommendations: ['Review historical patterns', 'Check for external factors'],
      requiresAction: true
    };
  }
}

export async function generatePrediction(historicalData, targetMetric, period) {
  const messages = [
    {
      role: 'system',
      content: 'You are a predictive analytics expert. Based on historical data, provide predictions. Format response as JSON with fields: predictedValue (number), confidenceInterval (object with lower and upper), accuracy (0-100), factors (array of influencing factors), trend (up/down/stable).'
    },
    {
      role: 'user',
      content: `Target Metric: ${targetMetric}\nPrediction Period: ${period}\nHistorical Data: ${JSON.stringify(historicalData)}`
    }
  ];

  const response = await callOpenRouter(messages);
  try {
    return JSON.parse(response);
  } catch {
    return {
      predictedValue: historicalData[historicalData.length - 1]?.value * 1.05 || 0,
      confidenceInterval: { lower: 0, upper: 0 },
      accuracy: 75,
      factors: ['Historical trends'],
      trend: 'stable'
    };
  }
}

export async function generateReport(data, reportType, preferences) {
  const messages = [
    {
      role: 'system',
      content: `You are a business intelligence report generator. Create a comprehensive ${reportType} report based on the provided data. Include executive summary, key metrics, insights, and recommendations. Format as markdown.`
    },
    {
      role: 'user',
      content: `Report Type: ${reportType}\nPreferences: ${JSON.stringify(preferences)}\nData: ${JSON.stringify(data)}`
    }
  ];

  return await callOpenRouter(messages);
}

export async function chatWithData(message, context, conversationHistory = []) {
  const messages = [
    {
      role: 'system',
      content: `You are an AI data analyst assistant. Help users understand their data, answer questions, and provide insights. You have access to the following data context:\n${JSON.stringify(context)}\n\nBe helpful, specific, and provide actionable insights when possible.`
    },
    ...conversationHistory,
    {
      role: 'user',
      content: message
    }
  ];

  return await callOpenRouter(messages);
}

export async function suggestOptimizations(currentState, goals) {
  const messages = [
    {
      role: 'system',
      content: 'You are a business optimization expert. Analyze the current state and goals, then suggest specific optimizations. Format response as JSON with fields: optimizations (array of {title, description, expectedImpact, difficulty, priority}).'
    },
    {
      role: 'user',
      content: `Current State:\n${JSON.stringify(currentState)}\n\nGoals:\n${JSON.stringify(goals)}`
    }
  ];

  const response = await callOpenRouter(messages);
  try {
    return JSON.parse(response);
  } catch {
    return {
      optimizations: [{
        title: 'Review Current Metrics',
        description: 'Analyze current performance metrics for improvement opportunities',
        expectedImpact: 'Medium',
        difficulty: 'Low',
        priority: 1
      }]
    };
  }
}

export async function summarizeData(data, format = 'executive') {
  const messages = [
    {
      role: 'system',
      content: `You are a data summarization expert. Create a ${format} summary of the provided data. Be concise but comprehensive. Highlight key points, trends, and notable items.`
    },
    {
      role: 'user',
      content: JSON.stringify(data)
    }
  ];

  return await callOpenRouter(messages);
}

export default {
  generateInsight,
  generateSQLFromNaturalLanguage,
  analyzeAnomaly,
  generatePrediction,
  generateReport,
  chatWithData,
  suggestOptimizations,
  summarizeData
};
