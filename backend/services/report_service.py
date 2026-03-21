import csv
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from typing import List, Dict

class ReportGenerator:
    @staticmethod
    def generate_csv(data: List[Dict]) -> str:
        output = io.StringIO()
        if not data: return ""
        
        keys = data[0].keys()
        dict_writer = csv.DictWriter(output, fieldnames=keys)
        dict_writer.writeheader()
        dict_writer.writerows(data)
        return output.getvalue()

    @staticmethod
    def generate_pdf(data: List[Dict], title: str) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        elements.append(Paragraph(f"<b>{title}</b>", styles['Title']))
        elements.append(Spacer(1, 12))

        if not data:
            elements.append(Paragraph("No data available for this segment.", styles['Normal']))
        else:
            # Table Data
            header = ["ID", "Name", "Risk (%)", "LTV ($)", "Action"]
            table_data = [header]
            for item in data:
                table_data.append([
                    str(item.get('customer_id', '')),
                    str(item.get('name', '')),
                    f"{item.get('churn_risk', 0):.1f}%",
                    f"${item.get('revenue', 0) * 12:.0f}",
                    str(item.get('action', 'N/A'))
                ])

            t = Table(table_data)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.dodgerblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
            ]))
            elements.append(t)

        doc.build(elements)
        return buffer.getvalue()
