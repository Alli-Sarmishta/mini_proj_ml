require('dotenv').config();
const puppeteer = require('puppeteer');
const { scrapeJobs } = require('./scrapers');
const axios = require('axios');
const generateResume = require("./generateResume");
const { fetchUsers } = require('./utils');

// JWT token configuration
const JWT_TOKEN = process.env.JWT_TOKEN || 'your-jwt-token-here';
const API_BASE_URL = 'https://miniprojectfinal.onrender.com';

// Main scheduler function
async function runScheduler() {
    try {
        const users = await fetchUsers();
        console.log('Fetched resumes:', users);
        console.log(`👤 Total users fetched: ${users.length}`);

        const results = [];
        for (const user of users) {
            console.log(`🔍 Searching jobs for ${user.Name}`);
            console.log('User Skills:', user.Skills);
            
            // Skip users without skills
            if (!user.Skills || !user.Skills.TechnicalSkills || user.Skills.TechnicalSkills.length === 0) {
                console.log(`⚠️ Skipping ${user.Name} - no skills found`);
                continue;
            }

            const jobs = await scrapeJobs(user);
            console.log(`✅ Found ${jobs.length} jobs for ${user.Name}`);

            for (const job of jobs) {
                try {
                    const isEligible = await checkUserEligibility(user, job); // Check eligibility
                    if (isEligible) {
                        const pdfPath = await generateResume(user, job); // Generate resume only if eligible
                        results.push(pdfPath);
                    } else {
                        console.log(`⚠️ ${user.Name} is not eligible for ${job.title}`);
                    }
                } catch (error) {
                    console.error(`❌ Error processing job for ${user.Name}:`, error);
                }
            }
        }

        console.log('Resume generation results:', results);
    } catch (error) {
        console.error('❌ Scheduler error:', error);
    }
}

async function checkUserEligibility(user, job) {
    const userTechnicalSkills = user.Skills.TechnicalSkills || [];
    const jobRequiredSkills = job.requirements || []; // Assuming job has a 'requirements' field
    const totalUserExperience = parseInt(user.TotalYearsOverall) || 0;
    const jobExperienceRequired = job.experienceRequired || 0; // Assuming job has an 'experienceRequired' field

    // Check if the user has the required technical skills
    const hasTechnicalSkills = jobRequiredSkills.some(skill => userTechnicalSkills.includes(skill));

    // Check if the user meets the experience requirement
    return hasTechnicalSkills && (totalUserExperience >= jobExperienceRequired);
}

// Run the scheduler
runScheduler();
