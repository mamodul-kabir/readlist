const http = require('http');

// Helper to make HTTP requests
function request(options, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port: 3000,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      const responseCookies = res.headers['set-cookie'];
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json, headers: res.headers, cookies: responseCookies });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers, cookies: responseCookies });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting ReadList Automated Integration Tests...\n');

  // Test 1: Signup User 1
  const tag1 = 'testuser_' + Date.now().toString().slice(-4);
  const email1 = `${tag1}@example.com`;
  console.log(`1. Testing Signup for ${email1} (@${tag1})...`);

  const signupRes = await request(
    { path: '/api/auth/signup', method: 'POST' },
    { email: email1, password: 'password123', tag: tag1, name: 'Test Reader 1' }
  );

  if (signupRes.status !== 200 || !signupRes.data.user) {
    throw new Error(`Signup failed! Status: ${signupRes.status}, Error: ${JSON.stringify(signupRes.data)}`);
  }
  console.log('   ✓ Signup successful:', signupRes.data.user);

  const cookieHeader = signupRes.cookies ? signupRes.cookies[0].split(';')[0] : null;

  // Test 2: Login with Email
  console.log('\n2. Testing Login with Email...');
  const loginRes = await request(
    { path: '/api/auth/login', method: 'POST' },
    { email: email1, password: 'password123' }
  );
  if (loginRes.status !== 200 || !loginRes.data.user) {
    throw new Error(`Login failed! Status: ${loginRes.status}`);
  }
  console.log('   ✓ Login successful:', loginRes.data.user.email);

  // Test 3: Add Currently Reading Books (Max 4 test)
  console.log('\n3. Testing Currently Reading 4-Book Constraint...');
  for (let i = 1; i <= 4; i++) {
    const bookRes = await request(
      { path: '/api/books', method: 'POST' },
      {
        title: `Currently Reading Book ${i}`,
        authors: `Author ${i}`,
        status: 'currently_reading',
        start_date: '2026-08-01'
      },
      cookieHeader
    );
    if (bookRes.status !== 201) {
      throw new Error(`Failed to add book ${i}: ${JSON.stringify(bookRes.data)}`);
    }
    console.log(`   ✓ Added currently reading book ${i}/4`);
  }

  // Attempting 5th Currently Reading Book (Should Fail with 400)
  console.log('   Testing 5th book addition (should be rejected by max 4 constraint)...');
  const book5Res = await request(
    { path: '/api/books', method: 'POST' },
    {
      title: 'Excess Currently Reading Book 5',
      authors: 'Author 5',
      status: 'currently_reading'
    },
    cookieHeader
  );
  if (book5Res.status === 400 && book5Res.data.error) {
    console.log('   ✓ 5th book correctly rejected:', book5Res.data.error);
  } else {
    throw new Error(`Constraint check failed! Expected 400 error but got: ${book5Res.status}`);
  }

  // Test 4: Add Read Books with Years, Dates, and Reviews
  console.log('\n4. Testing Adding Read Books with Years and Reviews...');
  const readBookRes = await request(
    { path: '/api/books', method: 'POST' },
    {
      title: 'The Great Gatsby',
      authors: 'F. Scott Fitzgerald',
      status: 'read',
      year: 2025,
      finish_date: '2025-05-15',
      review: 'A masterful novel about the American Dream in the 1920s.'
    },
    cookieHeader
  );
  if (readBookRes.status !== 201) {
    throw new Error(`Failed to add read book: ${JSON.stringify(readBookRes.data)}`);
  }
  console.log('   ✓ Read book added with review and year 2025');

  // Test 5: Add Unfinished Book
  console.log('\n5. Testing Adding Unfinished Book...');
  const unfinishedRes = await request(
    { path: '/api/books', method: 'POST' },
    {
      title: 'Complex Physics Volume 3',
      authors: 'Richard Feynman',
      status: 'unfinished'
    },
    cookieHeader
  );
  if (unfinishedRes.status !== 201) {
    throw new Error(`Failed to add unfinished book: ${JSON.stringify(unfinishedRes.data)}`);
  }
  console.log('   ✓ Unfinished book added');

  // Test 6: Fetch Profile Publicly
  console.log(`\n6. Testing Fetch Public Profile for @${tag1}...`);
  const publicProfileRes = await request({ path: `/api/user/profile/${tag1}` });
  if (publicProfileRes.status !== 200 || publicProfileRes.data.isPrivate) {
    throw new Error(`Public profile fetch failed: ${JSON.stringify(publicProfileRes.data)}`);
  }
  console.log(`   ✓ Fetched public profile for @${tag1}. Total books: ${publicProfileRes.data.books.length}`);

  // Test 7: Toggle Account Privacy
  console.log('\n7. Testing Account Privacy Toggle...');
  const settingsRes = await request(
    { path: '/api/user/settings', method: 'PUT' },
    { is_private: 1 },
    cookieHeader
  );
  if (settingsRes.status !== 200 || settingsRes.data.user.is_private !== 1) {
    throw new Error(`Settings update failed: ${JSON.stringify(settingsRes.data)}`);
  }
  console.log('   ✓ Account set to PRIVATE');

  // Verify Anonymous Visitor is Blocked
  const anonProfileRes = await request({ path: `/api/user/profile/${tag1}` });
  if (anonProfileRes.status === 200 && anonProfileRes.data.isPrivate) {
    console.log('   ✓ Anonymous visitor correctly blocked from viewing private profile!');
  } else {
    throw new Error(`Privacy enforcement failed! Anonymous visitor got: ${JSON.stringify(anonProfileRes.data)}`);
  }

  // Verify Owner Can Still View Private Profile
  const ownerProfileRes = await request({ path: `/api/user/profile/${tag1}` }, null, cookieHeader);
  if (ownerProfileRes.status === 200 && !ownerProfileRes.data.isPrivate) {
    console.log('   ✓ Owner can view their own private profile!');
  } else {
    throw new Error(`Owner private access failed! Owner got: ${JSON.stringify(ownerProfileRes.data)}`);
  }

  console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! Everything works cleanly!\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
