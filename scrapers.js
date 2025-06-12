const { timeout } = require('puppeteer');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
require('dotenv').config();

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// List of user agents to rotate
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
];

// LinkedIn credentials
//const LINKEDIN_EMAIL = process.env.LINKEDIN_EMAIL; // Use environment variable for email
//const LINKEDIN_PASSWORD = process.env.LINKEDIN_PASSWORD; // Use environment variable for password

// ✅ LinkedIn Scraper (title-based matching)
// async function scrapeLinkedIn(searchTerm) {
//     const browser = await puppeteer.launch({
//         headless: false,
//         args: [
//             '--no-sandbox',
//             '--disable-setuid-sandbox',
//             '--disable-dev-shm-usage',
//             '--disable-accelerated-2d-canvas',
//             '--disable-gpu',
//             '--window-size=1920x1080'
//         ]
//     });

//     const page = await browser.newPage();
    
//     // Set random user agent
//     await page.setUserAgent(getRandomItem(userAgents));
    
//     try {
//         // Go to LinkedIn login page
//         await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle0' });

//         // Login with human-like behavior
//         await page.type('#username', LINKEDIN_EMAIL, { delay: 100 });
//         await page.type('#password', LINKEDIN_PASSWORD, { delay: 100 });
//         await page.click('button[type="submit"]');
//         await page.waitForNavigation({ waitUntil: 'networkidle0' });

//         // Navigate to jobs page
//         await page.goto('https://www.linkedin.com/jobs/', { waitUntil: 'networkidle0' });

//         // Search for jobs
//         await page.type('.jobs-search-box__text-input', searchTerm, { delay: 100 });
//         await page.keyboard.press('Enter');
//         await page.waitForNavigation({ waitUntil: 'networkidle0' });

//         // Wait for search results
//         await page.waitForSelector('.jobs-search-results__list-item, .job-card-container, .job-card', { timeout: 30000 });

//         // Extract job listings
//         const jobs = await page.evaluate(() => {
//             const jobElements = document.querySelectorAll('.jobs-search-results__list-item, .job-card-container, .job-card');
//             return Array.from(jobElements).map(job => {
//                 const titleElement = job.querySelector('.job-card-list__title, .job-card-container__link');
//                 const companyElement = job.querySelector('.job-card-container__company-name, .job-card-container__primary-description');
//                 const locationElement = job.querySelector('.job-card-container__metadata-item, .job-card-container__metadata-wrapper');
//                 const linkElement = job.querySelector('a.job-card-list__title, a.job-card-container__link');

//                 return {
//                     title: titleElement ? titleElement.textContent.trim() : 'Unknown Position',
//                     company: companyElement ? companyElement.textContent.trim() : 'Unknown Company',
//                     location: locationElement ? locationElement.textContent.trim() : 'Unknown Location',
//                     link: linkElement ? linkElement.href : '#'
//                 };
//             });
//         });

//         await browser.close();
//         return jobs;
//     } catch (error) {
//         console.error('❌ LinkedIn scraping error:', error.message);
//         await browser.close();
//         return []; // Return an empty array on error
//     }
// }

// ✅ Glassdoor Scraper (title-based matching)
async function scrapeGlassdoor(searchTerm) {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920x1080'
        ]
    });

    const page = await browser.newPage();
    
    // Set random user agent
    await page.setUserAgent(getRandomItem(userAgents));
    
    try {
        // Construct the Glassdoor job search URL
        const url = `https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${encodeURIComponent(searchTerm)}`;
        await page.goto(url, { waitUntil: 'networkidle0' });

        // Wait for job listings to load
        await page.waitForSelector('.JobDetails_jobDetailsHeader__Hd9M3', { timeout: 30000 });

        // Extract job listings
        const jobs = await page.evaluate(() => {
            const jobElements = document.querySelectorAll('.JobDetails_jobDetailsHeader__Hd9M3');
            return Array.from(jobElements).map(job => {
                const titleElement = job.querySelector('h1.heading_Heading__BqX5J');
                const companyElement = job.querySelector('.EmployerProfile_employerNameHeading__bXBYr h4');
                const locationElement = job.querySelector('.JobDetails_jobDetailsHeaderCta__kIZNu'); // Adjust as needed
                const linkElement = job.querySelector('a.EmployerProfile_profileContainer__63w3R');

                return {
                    title: titleElement ? titleElement.textContent.trim() : 'Unknown Position',
                    company: companyElement ? companyElement.textContent.trim() : 'Unknown Company',
                    location: locationElement ? locationElement.textContent.trim() : 'Unknown Location',
                    link: linkElement ? `https://www.glassdoor.co.in${linkElement.href}` : '#'
                };
            });
        });

        await browser.close();
        return jobs;
    } catch (error) {
        console.error('❌ Glassdoor scraping error:', error.message);
        await browser.close();
        return []; // Return an empty array on error
    }
}

// Helper function to get a random item from an array
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Function to generate search terms based on user skills
function generateSearchTerms(user) {
    const searchTerms = new Set();
    const skills = user.Skills?.TechnicalSkills || [];
    
    // Map skills to job titles
    const skillToJobMap = {
        'Python': ['Python Developer', 'Data Scientist', 'Machine Learning Engineer', 'Data Analyst'],
        'Java': ['Java Developer', 'Software Engineer', 'Backend Developer'],
        'C++': ['C++ Developer', 'Software Engineer', 'Systems Developer'],
        'SQL': ['Database Administrator', 'Data Analyst', 'Business Intelligence Analyst'],
        'HTML': ['Frontend Developer', 'Web Developer', 'UI Developer'],
        'CSS': ['Frontend Developer', 'Web Developer', 'UI Developer'],
        'JavaScript': ['Frontend Developer', 'Web Developer', 'Full Stack Developer'],
        'React': ['React Developer', 'Frontend Developer', 'Web Developer'],
        'Node.js': ['Node.js Developer', 'Backend Developer', 'Full Stack Developer'],
        'Flutter': ['Mobile Developer', 'Flutter Developer', 'App Developer'],
        'React Native': ['Mobile Developer', 'React Native Developer', 'App Developer'],
        'Tableau': ['Data Analyst', 'Business Intelligence Analyst', 'Data Visualization Specialist'],
        'Selenium': ['QA Engineer', 'Test Automation Engineer', 'Software Test Engineer'],
        'Git': ['DevOps Engineer', 'Software Engineer'],
        'AWS': ['Cloud Engineer', 'DevOps Engineer', 'Cloud Architect'],
        'Azure': ['Cloud Engineer', 'DevOps Engineer', 'Cloud Architect'],
        'Docker': ['DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer'],
        'Kubernetes': ['DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer'],
        'Machine Learning': ['Machine Learning Engineer', 'Data Scientist', 'AI Engineer'],
        'Data Structures': ['Software Engineer', 'Backend Developer'],
        'Algorithms': ['Software Engineer', 'Backend Developer'],
        'OOPs': ['Software Engineer', 'Backend Developer'],
        'SDLC': ['Software Engineer', 'Project Manager'],
        'UML': ['Software Engineer', 'System Analyst'],
        'Wordpress': ['WordPress Developer', 'Web Developer'],
        'Microsoft Excel': ['Data Analyst', 'Business Analyst'],
        'Powerpoint': ['Business Analyst', 'Project Manager'],
        'Pandas': ['Data Scientist', 'Data Analyst', 'Machine Learning Engineer'],
        'NumPy': ['Data Scientist', 'Data Analyst', 'Machine Learning Engineer'],
        'MySQL': ['Database Administrator', 'Backend Developer'],
        'PostgreSQL': ['Database Administrator', 'Backend Developer']
    };

    // Add job titles based on user's skills
    skills.forEach(skill => {
        const jobTitles = skillToJobMap[skill] || [];
        jobTitles.forEach(title => searchTerms.add(title));
    });

    // Add some general roles based on experience level
    const yearsOfExperience = parseInt(user.TotalYearsOverall) || 0;
    if (yearsOfExperience < 2) {
        searchTerms.add('Junior Software Engineer');
        searchTerms.add('Entry Level Developer');
    } else if (yearsOfExperience < 5) {
        searchTerms.add('Software Engineer');
        searchTerms.add('Mid Level Developer');
    } else {
        searchTerms.add('Senior Software Engineer');
        searchTerms.add('Lead Developer');
    }

    // Convert Set to Array and limit to 10 most relevant terms
    return Array.from(searchTerms).slice(0, 10);
}

// Function to match jobs with user skills
function matchJobsWithSkills(jobs, userSkills) {
    return jobs.map(job => {
        const matchScore = calculateMatchScore(job, userSkills);
        return { ...job, matchScore };
    }).sort((a, b) => b.matchScore - a.matchScore);
}

// Function to calculate match score
function calculateMatchScore(job, user) {
    if (!user || !user.Skills) return 0;
    
    const userSkills = user.Skills;
    const jobTitle = job.title.toLowerCase();
    const jobDescription = job.description.toLowerCase();
    
    let score = 0;
    
    // Check technical skills
    if (userSkills.TechnicalSkills && userSkills.TechnicalSkills.length > 0) {
        userSkills.TechnicalSkills.forEach(skill => {
            const skillLower = skill.toLowerCase();
            if (jobTitle.includes(skillLower) || jobDescription.includes(skillLower)) {
                score += 2; // Increase score for a match
            }
        });
    }
    
    // Check soft skills
    if (userSkills.SoftSkills && userSkills.SoftSkills.length > 0) {
        userSkills.SoftSkills.forEach(skill => {
            const skillLower = skill.toLowerCase();
            if (jobDescription.includes(skillLower)) {
                score += 1; // Increase score for a match
            }
        });
    }
    
    return score;
}

// Main function to scrape jobs
async function scrapeJobs(user) {
    const searchTerms = generateSearchTerms(user);
    console.log('🔍 Generated search terms:', searchTerms);

    // Try Glassdoor first
    try {
        console.log('🔍 Starting Glassdoor job search...');
        const glassdoorJobs = await scrapeGlassdoor(searchTerms[0]);
        if (glassdoorJobs && glassdoorJobs.length > 0) {
            return glassdoorJobs;
        }
    } catch (error) {
        console.log('⚠️ Glassdoor scraping failed, using fallback jobs');
    }

    // If Glassdoor fails, return an empty array or handle fallback jobs
    return [];
}

// Export the scraping function
module.exports = {
    // scrapeLinkedIn, // Commented out for now
    scrapeGlassdoor,
    scrapeJobs,
};