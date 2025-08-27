cat > addStudentsImproved.js << 'EOL'
const { chromium } = require('playwright');

// Configuration
const CONFIG = {
  headless: false,
  slowMo: 100,
  baseUrl: 'http://localhost:4001',
  numStudents: 5,  // Start with 5 students for testing
  timeouts: {
    navigation: 30000,
    action: 10000,
    selector: 10000
  }
};

// Generate random student data locally
function generateStudentData() {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Olivia'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  const classes = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5'];
  
  const randomDate = () => {
    const start = new Date(2000, 0, 1);
    const end = new Date(2010, 11, 31);
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
  };

  return {
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    dob: randomDate(),
    gender: Math.random() > 0.5 ? 'Male' : 'Female',
    classLevel: classes[Math.floor(Math.random() * classes.length)],
    feesPaid: Math.floor(50000 + Math.random() * 20000),
    phone: '6' + Math.floor(10000000 + Math.random() * 90000000).toString()
  };
}

// Helper function to safely interact with elements
async function safeAction(description, action) {
  try {
    console.log(`  ${description}...`);
    await action();
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to ${description}:`, error.message);
    return false;
  }
}

async function addStudent(page, student) {
  console.log(`\nAdding student: ${student.firstName} ${student.lastName}`);
  
  try {
    // Navigate to the page
    await page.goto(CONFIG.baseUrl, { 
      waitUntil: 'networkidle',
      timeout: CONFIG.timeouts.navigation
    });

    // Fill in basic info
    await safeAction('fill first name', () => 
      page.locator('input[id*="first"], input[name*="first"]').fill(student.firstName)
    );
    
    await safeAction('fill last name', () => 
      page.locator('input[id*="last"], input[name*="last"]').fill(student.lastName)
    );

    // Handle date input - try multiple possible selectors
    await safeAction('fill date of birth', async () => {
      const dateInput = page.locator('input[type="date"], [id*="date"], [name*="date"]').first();
      await dateInput.fill(student.dob);
    });

    // Handle gender selection - try multiple approaches
    await safeAction('select gender', async () => {
      const genderInput = page.locator(`input[type="radio"][value*="${student.gender.toLowerCase()}"], 
                                      input[type="radio"][name*="gender"]`).first();
      await genderInput.check();
    });

    // Select class
    await safeAction('select class', async () => {
      await page.selectOption('select', { label: student.classLevel });
    });

    // Fill fees and phone
    await safeAction('fill fees paid', () => 
      page.locator('input[id*="fee"], input[name*="fee"], input[placeholder*="fee"]').fill(student.feesPaid.toString())
    );

    await safeAction('fill phone number', () => 
      page.locator('input[id*="phone"], input[name*="phone"], input[type="tel"]').fill(student.phone)
    );

    // Submit the form
    await safeAction('submit form', async () => {
      const submitButton = page.locator('button:has-text("Add Student"), input[type="submit"]').first();
      await submitButton.click({ timeout: CONFIG.timeouts.action });
    });

    // Wait for success notification or form reset
    await safeAction('wait for success', async () => {
      await Promise.race([
        page.waitForSelector('.notification, .success-message, .alert-success', { 
          state: 'visible', 
          timeout: CONFIG.timeouts.selector 
        }),
        page.waitForSelector('input[value=""]', { 
          state: 'visible', 
          timeout: CONFIG.timeouts.selector 
        })
      ]);
    });

    console.log(`✅ Successfully added ${student.firstName} ${student.lastName}`);
    return true;

  } catch (error) {
    console.error(`❌ Failed to add student ${student.firstName} ${student.lastName}:`, error.message);
    await page.screenshot({ path: `error-${Date.now()}.png` });
    return false;
  }
}

async function main() {
  const browser = await chromium.launch({ 
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  let successCount = 0;

  try {
    for (let i = 0; i < CONFIG.numStudents; i++) {
      const student = generateStudentData();
      console.log(`\n--- Student ${i + 1} of ${CONFIG.numStudents} ---`);
      
      const success = await addStudent(page, student);
      if (success) successCount++;
      
      // Small delay between students
      await page.waitForTimeout(1000);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    console.log(`\n✅ Completed! Successfully added ${successCount} out of ${CONFIG.numStudents} students.`);
    await browser.close();
  }
}

// Run the script
main().catch(console.error);