const { chromium } = require('playwright');

function generateLocalStudentData() {
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

async function addStudent(page, student) {
  try {
    await page.goto('http://localhost:4001');
    console.log(`Adding student: ${student.firstName} ${student.lastName}`);
    
    // Fill in the form
    await page.fill('input[placeholder*="first name" i]', student.firstName);
    await page.fill('input[placeholder*="last name" i]', student.lastName);
    await page.fill('input[type="date"]', student.dob);
    
    // Select gender
    const genderSelector = `text="${student.gender}"`;
    await page.click(genderSelector);
    
    // Select class
    await page.selectOption('select', { label: student.classLevel });
    
    // Fill in fees and phone
    await page.fill('input[placeholder*="fees paid" i]', student.feesPaid.toString());
    await page.fill('input[placeholder*="phone" i]', student.phone);
    
    // Submit the form
    await page.click('button:has-text("Add Student")');
    
    // Wait for success notification
    await page.waitForSelector('.notification', { timeout: 5000 });
    console.log(`✅ Added student: ${student.firstName} ${student.lastName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to add student ${student.firstName} ${student.lastName}:`, error.message);
    await page.screenshot({ path: `error-${Date.now()}.png` });
    return false;
  }
}

async function main() {
  const numStudents = 5; // Start with 5 students for testing
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  const page = await browser.newPage();
  let successCount = 0;

  try {
    for (let i = 0; i < numStudents; i++) {
      const student = generateLocalStudentData();
      console.log(`\n--- Student ${i + 1} of ${numStudents} ---`);
      const success = await addStudent(page, student);
      if (success) successCount++;
      await page.waitForTimeout(1000);
    }
  } finally {
    console.log(`\n✅ Completed! Successfully added ${successCount} out of ${numStudents} students.`);
    await browser.close();
  }
}

main().catch(console.error);
