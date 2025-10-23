// API endpoint for managing passenger preferences
import { NextRequest, NextResponse } from 'next/server';
import { PassengerPreferencesDB } from '@/lib/passenger-preferences';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const passengerId = searchParams.get('passengerId');
    const driverRating = parseFloat(searchParams.get('driverRating') || '4.0');
    
    if (!passengerId) {
      return NextResponse.json({
        error: 'Passenger ID is required'
      }, { status: 400 });
    }

    console.log('🎛️ [PASSENGER PREFERENCES] Fetching preferences');
    console.log(`   Passenger: ${passengerId}`);
    console.log(`   Driver Rating: ${driverRating}`);

    const preferences = await PassengerPreferencesDB.getPreferences(passengerId);
    
    if (!preferences) {
      console.log('📝 Creating default preferences for new passenger');
      const defaultPrefs = PassengerPreferencesDB.getDefaultPreferences(passengerId);
      await PassengerPreferencesDB.updatePreferences(passengerId, defaultPrefs);
      
      return NextResponse.json({
        success: true,
        data: {
          preferences: defaultPrefs,
          filteredPreferences: PassengerPreferencesDB.getFilteredPreferences(defaultPrefs, driverRating),
          accessLevel: PassengerPreferencesDB.getDriverAccessLevel(driverRating, defaultPrefs.min_driver_rating)
        }
      });
    }

    // Filter preferences based on driver rating (RAG)
    const filteredPreferences = PassengerPreferencesDB.getFilteredPreferences(preferences, driverRating);
    const accessLevel = PassengerPreferencesDB.getDriverAccessLevel(driverRating, preferences.min_driver_rating);

    console.log(`✅ Preferences retrieved - Access Level: ${accessLevel.accessLevel}`);

    return NextResponse.json({
      success: true,
      data: {
        preferences,
        filteredPreferences,
        accessLevel
      }
    });
    
  } catch (error) {
    console.error('Passenger preferences error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passengerId, preferences } = body;
    
    if (!passengerId || !preferences) {
      return NextResponse.json({
        error: 'Passenger ID and preferences are required'
      }, { status: 400 });
    }

    console.log('💾 [PASSENGER PREFERENCES] Updating preferences');
    console.log(`   Passenger: ${passengerId}`);
    console.log(`   Privacy Level: ${preferences.privacy_level}`);
    console.log(`   Min Driver Rating: ${preferences.min_driver_rating}`);

    const success = await PassengerPreferencesDB.updatePreferences(passengerId, preferences);
    
    if (success) {
      console.log('✅ Preferences updated successfully');
      return NextResponse.json({
        success: true,
        message: 'Preferences updated successfully'
      });
    } else {
      console.error('❌ Failed to update preferences in database');
      return NextResponse.json({
        success: false,
        error: 'Failed to update preferences'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT endpoint for partial updates
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { passengerId, updates } = body;
    
    if (!passengerId || !updates) {
      return NextResponse.json({
        error: 'Passenger ID and updates are required'
      }, { status: 400 });
    }

    console.log('🔄 [PASSENGER PREFERENCES] Partial update');
    console.log(`   Passenger: ${passengerId}`);
    console.log(`   Fields: ${Object.keys(updates).join(', ')}`);

    // Get existing preferences
    const existing = await PassengerPreferencesDB.getPreferences(passengerId);
    if (!existing) {
      return NextResponse.json({
        error: 'Passenger preferences not found'
      }, { status: 404 });
    }

    // Merge updates with existing preferences
    const mergedPreferences = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    const success = await PassengerPreferencesDB.updatePreferences(passengerId, mergedPreferences);
    
    if (success) {
      console.log('✅ Preferences partially updated');
      return NextResponse.json({
        success: true,
        message: 'Preferences updated successfully',
        data: mergedPreferences
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to update preferences'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Partial update error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}