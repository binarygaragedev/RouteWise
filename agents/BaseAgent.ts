import { auth0Manager, checkPermissions } from '../lib/auth0';
import { getAgentToken } from '../lib/tokenVault';
import { createAuditLog } from '../lib/db';
import OpenAI from 'openai';

export interface AgentContext {
  agentToken: string;
  timestamp: number;
  requestId: string;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  actionsToken?: number;
  dataAccessed: string[];
}

export abstract class BaseAgent {
  protected openai: OpenAI | null;
  protected agentName: string;
  protected context: AgentContext | null = null;
  protected isDemoMode: boolean;

  constructor(agentName: string) {
    this.agentName = agentName;
    
    // Check if we're in demo mode (no real OpenAI API key)
    const apiKey = process.env.OPENAI_API_KEY;
    this.isDemoMode = !apiKey || apiKey === 'sk-demo-key' || apiKey.startsWith('sk-demo');
    
    if (this.isDemoMode) {
      console.log(`🤖 [DEMO MODE] ${agentName} - Using mock AI responses`);
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    }
  }

  /**
   * Initialize the agent with authentication
   */
  protected async initialize(): Promise<AgentContext> {
    console.log(`🤖 [${this.agentName}] Initializing...`);
    
    let agentToken: string;
    
    // Check if we're in demo mode (demo Auth0 URLs)
    const auth0Url = process.env.AUTH0_ISSUER_BASE_URL;
    const isDemoAuth = !auth0Url || auth0Url.includes('demo.auth0.com') || auth0Url.includes('YOUR_DOMAIN');
    
    if (isDemoAuth || this.isDemoMode) {
      console.log(`🤖 [${this.agentName}] Demo mode - using mock agent token`);
      agentToken = 'demo-agent-token-' + Date.now();
    } else {
      agentToken = await getAgentToken();
    }
    
    this.context = {
      agentToken,
      timestamp: Date.now(),
      requestId: this.generateRequestId(),
    };

    console.log(`✓ [${this.agentName}] Authenticated with request ID: ${this.context.requestId}`);
    
    return this.context;
  }

  /**
   * Check if agent has permission to access data
   */
  protected async checkAccess(
    passengerId: string,
    driverId: string,
    dataCategory: string
  ): Promise<boolean> {
    const result = await checkPermissions(passengerId, driverId, dataCategory as any);
    
    if (result.allowed) {
      console.log(`✓ [${this.agentName}] Access granted to ${dataCategory}`);
    } else {
      console.log(`❌ [${this.agentName}] Access denied to ${dataCategory}: ${result.reason}`);
    }
    
    return result.allowed;
  }

  /**
   * Log agent actions for audit trail
   */
  protected async logAction(action: {
    action: string;
    subjectId?: string;
    dataAccessed?: string[];
    reason?: string;
  }): Promise<void> {
    await createAuditLog({
      action: action.action,
      actor_id: this.agentName,
      actor_type: 'agent',
      subject_id: action.subjectId,
      data_accessed: action.dataAccessed,
      reason: action.reason,
    });

    console.log(`📝 [${this.agentName}] Action logged: ${action.action}`);
  }

  /**
   * Call OpenAI with system context
   */
  protected async callAI(messages: any[], options?: {
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    // Demo mode: return mock AI response
    if (this.isDemoMode || !this.openai) {
      console.log('🤖 [DEMO AI] Generating mock response...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      return `Demo AI Response from ${this.agentName}:
      
Based on the provided data, here are my recommendations:
- Optimal route calculated considering current traffic
- Music playlist curated based on passenger preferences  
- Climate controls adjusted for comfort
- Safety protocols activated and monitoring initiated

All actions are being logged for audit purposes. Have a great ride!`;
    }

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are ${this.agentName}, an autonomous AI agent for RouteWise rideshare platform.
                   You make decisions and take actions based on the data provided.
                   You MUST respect privacy boundaries and only use data you're explicitly given.
                   Be concise, actionable, and helpful.`,
        },
        ...messages,
      ],
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 500,
    });

    const response = completion.choices[0].message.content || '';
    console.log(`🧠 [${this.agentName}] AI response: ${response.substring(0, 100)}...`);
    
    return response;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `${this.agentName.toLowerCase().replace(/\s/g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Abstract method - implement in child classes
   */
  abstract execute(...args: any[]): Promise<AgentResult>;

  /**
   * Handle errors gracefully
   */
  protected handleError(error: any): AgentResult {
    console.error(`❌ [${this.agentName}] Error:`, error);
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      dataAccessed: [],
    };
  }
}
