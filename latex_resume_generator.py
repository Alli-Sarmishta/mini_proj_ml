import os
import subprocess
import uuid



OUTPUT_DIR = "generated_resumes"

def generate_resume_pdf(data):
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    unique_id = str(uuid.uuid4())[:8]
    tex_filename = os.path.join(OUTPUT_DIR, f"{unique_id}_resume.tex")
    pdf_filename = os.path.join(OUTPUT_DIR, f"{unique_id}_resume.pdf")

    with open("resume_template.tex", "r") as template_file:
        tex_template = template_file.read()

    # Replace placeholders with user data (basic sanitization applied)
    tex_filled = tex_template \
        .replace("{{Name}}", data.get("Name", "Unknown")) \
        .replace("{{Email}}", data.get("Email", "")) \
        .replace("{{Phone}}", data.get("Phone", "")) \
        .replace("{{Summary}}", data.get("Summary", "")) \
        .replace("{{TotalYearsOverall}}", data.get("TotalYearsOverall", "")) \
        .replace("{{Links}}", format_list(data.get("Links", []))) \
        .replace("{{Skills}}", format_list(data.get("Skills", {}).get("TechnicalSkills", []))) \
        .replace("{{SoftSkills}}", format_list(data.get("Skills", {}).get("SoftSkills", []))) \
        .replace("{{Education}}", format_education(data.get("Education", []))) \
        .replace("{{Experience}}", format_experience(data.get("Experience", []))) \
        .replace("{{Projects}}", format_projects(data.get("Projects", []))) \
        .replace("{{Certifications}}", format_certifications(data.get("Certifications", [])))

    with open(tex_filename, "w") as f:
        f.write(tex_filled)

    try:
        subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", tex_filename],
            check=True,
            cwd=OUTPUT_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
    except subprocess.CalledProcessError as e:
        raise RuntimeError("PDF generation failed.") from e

    return pdf_filename


def format_list(items):
    return "\\\\\n".join(item.replace("&", "\\&") for item in items)


def format_education(education):
    lines = []
    for edu in education:
        degree = edu.get("Degree", "")
        institution = edu.get("Institution", "")
        year = edu.get("Year", "")
        grade = edu.get("CGPA", edu.get("Percentage", ""))
        line = f"\\textbf{{{degree}}}, {institution} ({year})\\\\Grade: {grade}"
        lines.append(line)
    return "\\\\\n".join(lines)


def format_experience(experience):
    lines = []
    for exp in experience:
        title = exp.get("job_title", "")
        company = exp.get("company", "")
        duration = exp.get("duration", "")
        description = exp.get("description", "")
        lines.append(f"\\textbf{{{title}}} at {company} ({duration})\\\\{description}")
    return "\\\\\n".join(lines) if lines else "N/A"


def format_projects(projects):
    lines = []
    for project in projects:
        name = project.get("Name", "")
        desc = project.get("Description", "")
        tech = project.get("Technologies", "")
        award = project.get("Award", "")
        date = project.get("Date", "")
        lines.append(f"\\textbf{{{name}}} ({date})\\\\{desc}\\\\Technologies: {tech}\\\\{award}")
    return "\\\\\n".join(lines)


def format_certifications(certs):
    if not certs:
        return "N/A"
    lines = []
    for cert in certs:
        name = cert.get("certification_name", "")
        org = cert.get("issuing_organization", "")
        year = cert.get("year", "")
        lines.append(f"{name} - {org} ({year})")
    return "\\\\\n".join(lines)
