/**
 * Test Audio Playback from Archive.org Collections
 * Tests if audio files can be fetched and streamed from configured collections
 */

const ARCHIVE_API_BASE = 'https://archive.org';
const METADATA_ENDPOINT = '/metadata';
const DOWNLOAD_ENDPOINT = '/download';

// Collection to test - pick one from the configured list
const TEST_COLLECTIONS = [
  '00-almuqaddimah-lecture-series',
  '01-babaltaharah-lecture-series',
  'mustahab-prayers-lecture-series'
];

// Supported audio formats (in order of preference)
const AUDIO_FORMATS = ['VBR MP3', 'MP3', '128Kbps MP3', '64Kbps MP3', 'OGG', 'FLAC'];

async function fetchMetadata(identifier) {
  try {
    console.log(`\n📥 Fetching metadata for: ${identifier}`);
    const response = await fetch(`${ARCHIVE_API_BASE}${METADATA_ENDPOINT}/${identifier}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Metadata fetched successfully`);
    console.log(`   Files count: ${data.files?.length || 0}`);

    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch metadata: ${error.message}`);
    return null;
  }
}

function extractAudioFiles(metadata) {
  if (!metadata?.files) return [];

  const audioFiles = metadata.files.filter(file => {
    return AUDIO_FORMATS.includes(file.format);
  });

  // Sort by track number if available
  audioFiles.sort((a, b) => {
    const trackA = parseInt(a.track || '0', 10);
    const trackB = parseInt(b.track || '0', 10);
    if (trackA !== trackB) return trackA - trackB;
    return a.name.localeCompare(b.name);
  });

  return audioFiles;
}

function getBestAudioFile(files) {
  if (!files.length) return null;

  // Return the first (highest quality) audio file
  return files[0];
}

function getStreamUrl(identifier, fileName) {
  return `${ARCHIVE_API_BASE}${DOWNLOAD_ENDPOINT}/${identifier}/${encodeURIComponent(fileName)}`;
}

async function testAudioUrl(url) {
  try {
    console.log(`\n🎵 Testing audio URL: ${url.substring(0, 80)}...`);

    // Send HEAD request to check if file exists and get headers
    const headResponse = await fetch(url, { method: 'HEAD' });

    if (!headResponse.ok) {
      throw new Error(`HTTP ${headResponse.status}: ${headResponse.statusText}`);
    }

    const contentLength = headResponse.headers.get('content-length');
    const contentType = headResponse.headers.get('content-type');
    const acceptRanges = headResponse.headers.get('accept-ranges');

    console.log(`✅ Audio file accessible`);
    console.log(`   Content-Type: ${contentType}`);
    console.log(`   File size: ${formatBytes(parseInt(contentLength) || 0)}`);
    console.log(`   Range support: ${acceptRanges === 'bytes' ? 'Yes ✓' : 'No ✗'}`);

    // Try fetching first 1KB to verify audio stream works
    console.log(`\n📊 Testing stream (fetching first 10KB)...`);
    const streamResponse = await fetch(url, {
      headers: { Range: 'bytes=0-10240' }
    });

    if (!streamResponse.ok) {
      throw new Error(`HTTP ${streamResponse.status}`);
    }

    const chunk = await streamResponse.blob();
    console.log(`✅ Audio stream works! Received ${formatBytes(chunk.size)}`);

    return {
      success: true,
      contentType,
      contentLength,
      supportsRanges: acceptRanges === 'bytes'
    };
  } catch (error) {
    console.error(`❌ Audio URL test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function runTests() {
  console.log('🧪 Audio Playback Testing for Archive.org Collections');
  console.log('='.repeat(60));

  for (const collectionId of TEST_COLLECTIONS) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Testing Collection: ${collectionId}`);
    console.log('─'.repeat(60));

    // Step 1: Fetch metadata
    const metadata = await fetchMetadata(collectionId);
    if (!metadata) continue;

    // Step 2: Extract audio files
    const audioFiles = extractAudioFiles(metadata);
    console.log(`\n🎵 Audio files found: ${audioFiles.length}`);

    if (audioFiles.length === 0) {
      console.log('   No audio files found in this collection');
      continue;
    }

    // Show first few audio files
    audioFiles.slice(0, 3).forEach((file, idx) => {
      console.log(`   ${idx + 1}. ${file.name} (${file.format})`);
    });

    if (audioFiles.length > 3) {
      console.log(`   ... and ${audioFiles.length - 3} more`);
    }

    // Step 3: Get best audio file
    const bestFile = getBestAudioFile(audioFiles);
    if (!bestFile) {
      console.log('   No suitable audio file found');
      continue;
    }

    // Step 4: Generate stream URL
    const streamUrl = getStreamUrl(collectionId, bestFile.name);

    // Step 5: Test the URL
    const testResult = await testAudioUrl(streamUrl);

    if (testResult.success) {
      console.log('\n✅ Audio playback from this collection is working!');
    }

    // Wait a bit before next test to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('✅ Audio playback testing completed!');
  console.log('═'.repeat(60));
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
