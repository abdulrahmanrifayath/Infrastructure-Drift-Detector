import csv
import io
from typing import List
from sqlalchemy.orm import Session
from app.repositories.drift_repository import drift_repository


class ReportExportService:
    """
    Export Service generating CSV reports and HTML/PDF formatted audit documentation.
    """

    def generate_csv_report(self, db: Session) -> str:
        events, _ = drift_repository.filter_drift_events(db, limit=1000)

        output = io.StringIO()
        writer = csv.writer(output)

        # CSV Header Row
        writer.writerow([
            "ID", "Resource Name", "Provider ID", "Resource Type",
            "Drift Category", "Severity", "Status", "Title", "Detected At"
        ])

        # CSV Data Rows
        for event in events:
            writer.writerow([
                event.id,
                event.resource_name,
                event.provider_id,
                event.resource_type,
                event.drift_category.value,
                event.severity.value,
                event.status.value,
                event.title,
                event.detected_at.isoformat()
            ])

        return output.getvalue()

    def generate_pdf_html_report(self, db: Session) -> str:
        events, _ = drift_repository.filter_drift_events(db, limit=50)

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; color: #333; }}
                h1 {{ color: #0284c7; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 10px; font-size: 12px; text-align: left; }}
                th {{ background-color: #0f172a; color: #fff; }}
                .badge-critical {{ color: #dc2626; font-weight: bold; }}
                .badge-high {{ color: #d97706; font-weight: bold; }}
            </style>
        </head>
        <body>
            <h1>Infrastructure Drift Detector - Executive Audit Report</h1>
            <p>Generated at: {events[0].detected_at if events else 'N/A'}</p>
            <p>Total Drift Events: {len(events)}</p>

            <table>
                <thead>
                    <tr>
                        <th>Resource Name</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Severity</th>
                        <th>Provider ID</th>
                    </tr>
                </thead>
                <tbody>
        """

        for event in events:
            sev_class = "badge-critical" if "Critical" in event.severity.value else "badge-high"
            html += f"""
                    <tr>
                        <td><b>{event.resource_name}</b></td>
                        <td>{event.resource_type}</td>
                        <td>{event.drift_category.value}</td>
                        <td class="{sev_class}">{event.severity.value}</td>
                        <td><code>{event.provider_id}</code></td>
                    </tr>
            """

        html += """
                </tbody>
            </table>
        </body>
        </html>
        """
        return html


report_export_service = ReportExportService()
