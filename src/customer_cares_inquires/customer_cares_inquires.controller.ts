// // controllers/inquiry.controller.ts
// import { Request, Response } from 'express';
// import { IInquiry } from './customer_cares_inquires.module';

// // GET /api/inquiries
// export const getInquiries = async (req: Request, res: Response) => {
//   try {
//     const inquiries: IInquiry[] = await Inquiry.find();
//     res.json(inquiries);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // GET /api/inquiries/:id
// export const getInquiryById = async (req: Request, res: Response) => {
//   try {
//     const inquiry = await Inquiry.findById(req.params.id);
//     if (!inquiry) {
//       return res.status(404).json({ message: 'Inquiry not found' });
//     }
//     res.json(inquiry);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // POST /api/inquiries
// export const logInquiryIssue = async (req: Request, res: Response) => {
//   try {
//     const { title, details, source, customer } = req.body;
//     // Basic validation for required fields
//     if (!title || !details || !source) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }
//     const newInquiry = new Inquiry({
//       title,
//       details,
//       source,
//       customer,
//     });
//     await newInquiry.save();
//     res.status(201).json(newInquiry);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // PUT /api/inquiries/:id
// export const updateInquiryStatus = async (req: Request, res: Response) => {
//   try {
//     const { status, resolutionNotes, chatHistory, rating } = req.body;
//     const inquiry = await Inquiry.findByIdAndUpdate(
//       req.params.id,
//       { status, resolutionNotes, chatHistory, rating },
//       { new: true }
//     );
//     if (!inquiry) {
//       return res.status(404).json({ message: 'Inquiry not found' });
//     }
//     res.json(inquiry);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Additional controllers can be created for handling template responses, escalations, etc.
