import os
import sys
import json
import subprocess

from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables from .env file

AUTH_TOKEN = os.getenv("AUTH_TOKEN")  # Get the token from the environment

OUTPUT_DIR = "generated_resumes"

def latex_escape(text):
    if not text:
        return ""
    return str(text).replace("&", "\\&").replace("%", "\\%").replace("_", "\\_")\
        .replace("#", "\\#").replace("{", "\\{").replace("}", "\\}").replace("^", "\\^{}")

def format_skills(skills):
    if not skills:
        return ""
    lines = []
    if "TechnicalSkills" in skills and skills["TechnicalSkills"]:
        lines.append("\\textbf{Technical Skills:} " + latex_escape(", ".join(skills["TechnicalSkills"])))
    if "SoftSkills" in skills and skills["SoftSkills"]:
        lines.append("\\textbf{Soft Skills:} " + latex_escape(", ".join(skills["SoftSkills"])))
    return "\\section*{Skills}\n" + "\n".join(lines)

def format_education(education):
    if not education:
        return ""
    blocks = []
    for edu in education:
        block = []
        if edu.get("Degree"):
            block.append(f"\\textbf{{{latex_escape(edu['Degree'])}}}")
        if edu.get("Institution"):
            block.append(latex_escape(edu["Institution"]))
        if edu.get("Year"):
            block.append(f"({latex_escape(edu['Year'])})")
        if edu.get("CGPA"):
            block.append(f"\\textit{{CGPA:}} {latex_escape(edu['CGPA'])}")
        if edu.get("Percentage"):
            block.append(f"\\textit{{Percentage:}} {latex_escape(edu['Percentage'])}")
        if edu.get("Achievements"):
            for ach in edu["Achievements"]:
                block.append(f"\\quad - {latex_escape(ach)}")
        if edu.get("RelevantCoursework"):
            block.append("\\textbf{Relevant Coursework:} " + ", ".join([latex_escape(c) for c in edu["RelevantCoursework"]]))
        blocks.append(" \\\\ ".join(block))
    return "\\section*{Education}\n" + "\n\\vspace{0.1cm}\n".join(blocks)

def format_experience(experience):
    if not experience:
        return ""
    blocks = []
    for exp in experience:
        block = []
        if exp.get("Title"):
            block.append(f"\\textbf{{{latex_escape(exp['Title'])}}}")
        if exp.get("Company"):
            block.append(latex_escape(exp["Company"]))
        if exp.get("Duration"):
            block.append(f"\\hfill {latex_escape(exp['Duration'])}")
        if exp.get("Description"):
            block.append(latex_escape(exp["Description"]))
        blocks.append(" \\\\ ".join(block))
    return "\\section*{Experience}\n" + "\n\\vspace{0.1cm}\n".join(blocks)

def format_projects(projects):
    if not projects:
        return ""
    blocks = []
    for proj in projects:
        block = []
        if proj.get("Name"):
            block.append(f"\\textbf{{{latex_escape(proj['Name'])}}}")
        if proj.get("Description"):
            block.append(latex_escape(proj["Description"]))
        if proj.get("Technologies"):
            block.append(f"\\textit{{Technologies:}} {latex_escape(proj['Technologies'])}")
        blocks.append(" \\\\ ".join(block))
    return "\\section*{Projects}\n" + "\n\\vspace{0.1cm}\n".join(blocks)

def format_certifications(certifications):
    if not certifications:
        return ""
    blocks = []
    for cert in certifications:
        block = []
        if cert.get("Name"):
            block.append(f"\\textbf{{{latex_escape(cert['Name'])}}}")
        if cert.get("Issuer"):
            block.append(latex_escape(cert["Issuer"]))
        if cert.get("Year"):
            block.append(f"({latex_escape(cert['Year'])})")
        blocks.append(" — ".join(block))
    return "\\section*{Certifications}\n" + "\n\\vspace{0.1cm}\n".join(blocks)

def format_links(links):
    if not links:
        return ""
    return " \\\\ ".join([f"\\href{{{link}}}{{{link}}}" for link in links])

def format_summary(summary):
    if not summary:
        return ""
    return f"\\section*{{Summary}}\n{latex_escape(summary)}"

def generate_resume_pdf(data):
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    user_id = data.get("userId", "user")
    job_id = data.get("job", {}).get("id", "job")
    pdf_basename = f"{user_id}_{job_id}"
    pdf_path = os.path.join(OUTPUT_DIR, f"{pdf_basename}.pdf")
    tex_path = os.path.join(OUTPUT_DIR, f"{pdf_basename}.tex")

    # Build contact information
    contact_lines = []
    if data.get("Name"):
        contact_lines.append(f"{{\\LARGE \\textbf{{{latex_escape(data['Name'])}}}}}")
    if data.get("Email"):
        contact_lines.append(latex_escape(data["Email"]))
    if data.get("Phone"):
        contact_lines.append(latex_escape(data["Phone"]))
    if data.get("Links"):
        contact_lines.append(format_links(data["Links"]))

    # Build LaTeX document
    latex = f"""
\\documentclass[10pt]{{article}}
\\usepackage[margin=0.5in]{{geometry}}
\\usepackage{{hyperref}}
\\usepackage{{parskip}}
\\pagenumbering{{gobble}}

\\begin{{document}}

\\begin{{center}}
{chr(10).join(contact_lines)}
\\end{{center}}

{format_summary(data.get("Summary", ""))}

{format_skills(data.get("Skills", {}))}

{format_education(data.get("Education", []))}

{format_experience(data.get("Experience", []))}

{format_projects(data.get("Projects", []))}

{format_certifications(data.get("Certifications", []))}

\\end{{document}}
"""

    # Write LaTeX file
    with open(tex_path, "w") as f:
        f.write(latex)

    try:
        # Run pdflatex twice to resolve references
        for _ in range(2):
            result = subprocess.run([
                "pdflatex",
                "-interaction=nonstopmode",
                f"-jobname={pdf_basename}",
                "-output-directory", OUTPUT_DIR,
                tex_path
            ], check=True, capture_output=True, text=True)

        # Clean up auxiliary files
        aux_files = ['.aux', '.log', '.out']
        for ext in aux_files:
            aux_path = os.path.join(OUTPUT_DIR, f"{pdf_basename}{ext}")
            if os.path.exists(aux_path):
                os.remove(aux_path)

        return {
            "user": user_id,
            "job": job_id,
            "message": "Resume generated",
            "pdf": pdf_path
        }

    except subprocess.CalledProcessError as e:
        print("❌ Error generating PDF:", e)
        print("❌ stdout:", e.stdout)
        print("❌ stderr:", e.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 generate_resume.py <data_file>")
        sys.exit(1)

    with open(sys.argv[1], 'r') as f:
        data = json.load(f)
    
    result = generate_resume_pdf(data)
    if result:
        print(result)