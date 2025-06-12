const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { execAsync } = require('./utils');

async function generateResume(user, job) {
    try {
        const data = {
            user: user,
            job: job
        };

        const latexContent = generateLatex(data);
        const timestamp = Date.now();
        const sanitizedUserName = user.Name.replace(/[^a-zA-Z0-9]/g, '_');
        const sanitizedJobTitle = (job.title || 'Unknown_Job').replace(/[^a-zA-Z0-9]/g, '_');
        const pdfPath = `generated_resumes/${sanitizedUserName}_${sanitizedJobTitle}_${timestamp}.pdf`;

        await generatePDF(latexContent, pdfPath);

        return pdfPath;
    } catch (error) {
        console.error('Error generating resume:', error);
        throw error;
    }
}

function sanitizeFilename(filename) {
    // Replace special characters with underscores
    return filename.replace(/[^a-zA-Z0-9]/g, '_');
}

async function generatePDF(user, job) {
    try {
        // Sanitize the filename
        const sanitizedJobTitle = sanitizeFilename(job.title);
        const outputFilename = `${user.name.replace(/\s+/g, '_')}_${sanitizedJobTitle}`;
        const outputPath = path.join('generated_resumes', outputFilename);
        
        // Create LaTeX content
        const latexContent = generateLaTeX(user, job);
        
        // Write LaTeX file
        fs.writeFileSync(`${outputPath}.tex`, latexContent);
        
        // Generate PDF
        const result = await execAsync(`pdflatex -interaction=nonstopmode -jobname="${outputFilename}" -output-directory generated_resumes "${outputPath}.tex"`);
        
        // Clean up auxiliary files
        try {
            fs.unlinkSync(`${outputPath}.aux`);
            fs.unlinkSync(`${outputPath}.log`);
            fs.unlinkSync(`${outputPath}.out`);
        } catch (err) {
            console.warn('Warning: Could not clean up auxiliary files:', err.message);
        }
        
        return `${outputFilename}.pdf`;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}

function generateLatex(data) {
    const { user, job } = data;
    
    // Format education entries
    const educationEntries = user.Education.map(edu => {
        let entry = `\\textbf{${edu.Year || ''}} & \\textbf{${edu.Degree || ''}}, \\textit{${edu.Institution || ''}} \\\\\n`;
        if (edu.Grade) entry += `& \\textbf{${edu.Grade}} \\\\\n`;
        if (edu.Coursework) entry += `& ${edu.Coursework} \\\\[3pt]\n`;
        if (edu.Achievements && Array.isArray(edu.Achievements)) {
            entry += `& \\begin{itemize}\n`;
            edu.Achievements.forEach(achievement => {
                entry += `    \\item ${achievement}\n`;
            });
            entry += `\\end{itemize}\n`;
        }
        return entry;
    }).join('\n');

    // Format skills
    const technicalSkills = user.Skills.TechnicalSkills ? user.Skills.TechnicalSkills.join(', ') : '';
    const softSkills = user.Skills.SoftSkills ? user.Skills.SoftSkills.join(', ') : '';

    // Format projects
    const projectEntries = user.Projects.map(project => {
        let entry = `\\textbf{${project.Name}} – \\textit{${project.Year || ''}}\n\n`;
        entry += `\\vspace{2pt}\n\\begin{itemize}\n`;
        entry += `  \\item ${project.Description}\n`;
        if (project.Technologies) {
            entry += `  \\item Technologies used: ${project.Technologies}\n`;
        }
        entry += `\\end{itemize}\n\n\\vspace{4pt}\n`;
        return entry;
    }).join('\n');

    // Format experience
    const experienceEntries = user.Experience.map(exp => {
        let entry = `\\textbf{${exp.Title}} at \\textit{${exp.Company}} – \\textit{${exp.Duration}}\n\n`;
        entry += `\\vspace{2pt}\n\\begin{itemize}\n`;
        if (exp.Description) {
            entry += `  \\item ${exp.Description}\n`;
        }
        if (exp.Responsibilities && Array.isArray(exp.Responsibilities)) {
            exp.Responsibilities.forEach(resp => {
                entry += `  \\item ${resp}\n`;
            });
        }
        entry += `\\end{itemize}\n\n\\vspace{4pt}\n`;
        return entry;
    }).join('\n');

    // Format certifications
    const certificationEntries = user.Certifications.map(cert => {
        return `\\textbf{${cert.Name}} from \\textit{${cert.Issuer}} – \\textit{${cert.Year}}\n\n`;
    }).join('\n');

    // Generate the LaTeX document
    return `\\documentclass[10pt]{article}
\\usepackage[a4paper,margin=1.2cm]{geometry}
\\usepackage{enumitem}
\\usepackage{xcolor}
\\usepackage{titlesec}
\\usepackage{tabularx}
\\usepackage[hidelinks]{hyperref}
\\usepackage{multicol}
\\setlist[itemize]{left=0pt,label=--,itemsep=2pt,topsep=0pt}
\\renewcommand{\\familydefault}{\\sfdefault}

% Section formatting
\\titleformat{\\section}{\\color{blue}\\Large\\bfseries}{}{0em}{}[\\titlerule]

\\begin{document}

\\begin{center}
    {\\LARGE \\textbf{${user.Name}}} \\\\
    \\vspace{2pt}
    \\href{mailto:${user.Email}}{${user.Email}} \\quad | \\quad ${user.Phone} \\quad | \\quad \\href{${user.Links[0] || '#'}}{${user.Links[0] || 'LinkedIn'}}
\\end{center}

\\vspace{4pt}
\\section*{Professional Summary}
${user.Summary}

\\vspace{4pt}
\\section*{Educational Qualification}
\\begin{tabularx}{\\linewidth}{@{}lX@{}}
${educationEntries}
\\end{tabularx}

\\vspace{4pt}
\\section*{Skills}

\\textbf{Technical Skills:} \\\\
${technicalSkills}

\\vspace{6pt}
\\textbf{Soft Skills:} \\\\
${softSkills}

\\vspace{4pt}
\\section*{Experience}

${experienceEntries}

\\vspace{4pt}
\\section*{Projects}

${projectEntries}

\\vspace{4pt}
\\section*{Certifications}

${certificationEntries}

\\end{document}`;
}

module.exports = generateResume; 