import express from 'express';
import { ReportService } from './ReportService';
import { InMemoryReportRepository } from '../infrastructure/InMemoryReportRepository';

const app = express();
const port = 3000;

const reportRepository = new InMemoryReportRepository();
const reportService = new ReportService(reportRepository);

app.use(express.json());

app.post('/reports', async (req, res) => {
    const { location, category, observationType, description } = req.body;
    if (!location || !category || !observationType) {
        return res.status(400).send({ error: 'Missing required fields' });
    }
    const report = await reportService.submitReport(location, category, observationType, description);
    res.status(201).send(report);
});

app.get('/reports', async (_req, res) => {
    const reports = await reportService.getReports();
    res.send(reports);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
