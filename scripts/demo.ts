import { config } from 'dotenv';
import { RidePreparationAgent } from '../agents/RidePreparation';
import { safetyMonitoringAgent } from '../agents/SafetyMonitoringAgent';

// Load environment variables
config({ path: '.env.local' });

const DEMO_DRIVER_ID = 'auth0|driver_sarah_verified';
const DEMO_PASSENGER_ID = 'auth0|passenger_john_123'; 
const DEMO_RIDE_ID = 'ride_demo_001';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDemo() {
  try {
    console.log(' ROUTEWISE AI - DEMO STARTING');
    
    // Demo 1: Ride Preparation
    console.log('\n=== DEMO 1: Ride Preparation ===');
    const rideAgent = new RidePreparationAgent();
    const result = await rideAgent.execute(DEMO_DRIVER_ID, DEMO_PASSENGER_ID);
    console.log(' Ride preparation completed');
    console.log('Summary:', result.data?.tips?.join(', ') || 'AI insights generated');
    console.log('Data used:', result.dataAccessed?.join(', ') || 'No data sources');
    
    await sleep(2000);
    
    // Demo 2: Safety Monitoring  
    console.log('\n=== DEMO 2: Safety Monitoring ===');
    const monitorResult = await safetyMonitoringAgent.startMonitoring(DEMO_RIDE_ID);
    
    if (monitorResult.success) {
      console.log(' Safety monitoring started');
      
      await sleep(3000);
      console.log('\n Simulating emergency...');
      
      const emergencyResult = await safetyMonitoringAgent.handleEmergency(DEMO_RIDE_ID, 'panic_button');
      
      if (emergencyResult.success) {
        console.log(' Emergency handled!');
        console.log('Actions:', emergencyResult.data.actions);
      }
      
      safetyMonitoringAgent.stopMonitoring(DEMO_RIDE_ID);
    }
    
    console.log('\n DEMO COMPLETE!');
    
  } catch (error) {
    console.error(' Demo failed:', error);
  }
}

if (require.main === module) {
  runDemo().catch(console.error);
}
