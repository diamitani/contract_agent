-- Create contract_templates table to store pre-built contract templates
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  fields JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (public read access for templates)
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read templates
CREATE POLICY "contract_templates_select_all" ON contract_templates
  FOR SELECT USING (true);

-- Only service role can insert/update/delete templates
CREATE POLICY "contract_templates_insert_service" ON contract_templates
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "contract_templates_update_service" ON contract_templates
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "contract_templates_delete_service" ON contract_templates
  FOR DELETE USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS contract_templates_slug_idx ON contract_templates(slug);
CREATE INDEX IF NOT EXISTS contract_templates_category_idx ON contract_templates(category);

-- Insert all 21 contract templates
INSERT INTO contract_templates (slug, title, description, icon, category, price, fields) VALUES
-- Original 12 contracts
('artist-management', 'Artist Management Agreement', 'Comprehensive agreement between an artist and their manager covering representation, duties, and compensation.', 'Users', 'Management', 10, '[
  {"name": "artistName", "label": "Artist/Band Name", "type": "text", "required": false},
  {"name": "managerName", "label": "Manager Name", "type": "text", "required": false},
  {"name": "managerCompany", "label": "Management Company", "type": "text", "required": false},
  {"name": "territory", "label": "Territory", "type": "text", "required": false},
  {"name": "termLength", "label": "Term Length", "type": "text", "required": false},
  {"name": "commissionRate", "label": "Commission Rate (%)", "type": "number", "required": false},
  {"name": "servicesIncluded", "label": "Services Included", "type": "textarea", "required": false},
  {"name": "exclusivity", "label": "Exclusivity Terms", "type": "textarea", "required": false},
  {"name": "terminationClause", "label": "Termination Conditions", "type": "textarea", "required": false},
  {"name": "effectiveDate", "label": "Effective Date", "type": "date", "required": false}
]'::jsonb),

('recording-contract', 'Recording Contract', 'Agreement between an artist and a record label for the production and distribution of recordings.', 'Disc3', 'Recording', 10, '[
  {"name": "artistName", "label": "Artist Name", "type": "text", "required": false},
  {"name": "labelName", "label": "Record Label Name", "type": "text", "required": false},
  {"name": "albumTitle", "label": "Album/Project Title", "type": "text", "required": false},
  {"name": "numberOfTracks", "label": "Number of Tracks", "type": "number", "required": false},
  {"name": "advanceAmount", "label": "Advance Amount ($)", "type": "number", "required": false},
  {"name": "royaltyRate", "label": "Royalty Rate (%)", "type": "number", "required": false},
  {"name": "recoupmentTerms", "label": "Recoupment Terms", "type": "textarea", "required": false},
  {"name": "deliveryDeadline", "label": "Delivery Deadline", "type": "date", "required": false},
  {"name": "optionPeriods", "label": "Option Periods", "type": "textarea", "required": false},
  {"name": "territory", "label": "Territory", "type": "text", "required": false}
]'::jsonb),

('publishing-deal', 'Publishing Deal', 'Music publishing agreement covering the rights and royalties for musical compositions.', 'FileMusic', 'Publishing', 10, '[
  {"name": "writerName", "label": "Songwriter Name", "type": "text", "required": false},
  {"name": "publisherName", "label": "Publisher Name", "type": "text", "required": false},
  {"name": "songTitles", "label": "Song Titles", "type": "textarea", "required": false},
  {"name": "publishingShare", "label": "Publishing Share (%)", "type": "number", "required": false},
  {"name": "writerShare", "label": "Writer Share (%)", "type": "number", "required": false},
  {"name": "advanceAmount", "label": "Advance Amount ($)", "type": "number", "required": false},
  {"name": "termLength", "label": "Term Length", "type": "text", "required": false},
  {"name": "territory", "label": "Territory", "type": "text", "required": false},
  {"name": "reversion", "label": "Reversion Terms", "type": "textarea", "required": false},
  {"name": "adminDuties", "label": "Administrative Duties", "type": "textarea", "required": false}
]'::jsonb),

('sync-license', 'Sync License Agreement', 'License agreement for synchronizing music with visual media like films, TV shows, or advertisements.', 'Film', 'Licensing', 10, '[
  {"name": "licensorName", "label": "Licensor (Rights Holder)", "type": "text", "required": false},
  {"name": "licenseeName", "label": "Licensee (Production)", "type": "text", "required": false},
  {"name": "songTitle", "label": "Song Title", "type": "text", "required": false},
  {"name": "projectTitle", "label": "Project Title", "type": "text", "required": false},
  {"name": "projectType", "label": "Project Type", "type": "select", "options": ["Film", "Television", "Commercial", "Video Game", "Online Content", "Other"], "required": false},
  {"name": "syncFee", "label": "Sync Fee ($)", "type": "number", "required": false},
  {"name": "territory", "label": "Territory", "type": "text", "required": false},
  {"name": "term", "label": "License Term", "type": "text", "required": false},
  {"name": "usageDescription", "label": "Usage Description", "type": "textarea", "required": false},
  {"name": "exclusivity", "label": "Exclusivity", "type": "select", "options": ["Exclusive", "Non-Exclusive"], "required": false}
]'::jsonb),

('live-performance', 'Live Performance Agreement', 'Contract for live music performances covering fees, technical requirements, and cancellation policies.', 'Music', 'Performance', 10, '[
  {"name": "artistName", "label": "Performer/Band Name", "type": "text", "required": false},
  {"name": "venueName", "label": "Venue Name", "type": "text", "required": false},
  {"name": "venueAddress", "label": "Venue Address", "type": "text", "required": false},
  {"name": "eventDate", "label": "Event Date", "type": "date", "required": false},
  {"name": "performanceTime", "label": "Performance Time", "type": "text", "required": false},
  {"name": "setLength", "label": "Set Length (minutes)", "type": "number", "required": false},
  {"name": "guaranteedFee", "label": "Guaranteed Fee ($)", "type": "number", "required": false},
  {"name": "backlineProvided", "label": "Backline Provided", "type": "textarea", "required": false},
  {"name": "soundcheckTime", "label": "Soundcheck Time", "type": "text", "required": false},
  {"name": "cancellationPolicy", "label": "Cancellation Policy", "type": "textarea", "required": false}
]'::jsonb),

('distribution-agreement', 'Distribution Agreement', 'Agreement between an artist/label and a distributor for the distribution of music across various platforms.', 'Share2', 'Distribution', 10, '[
  {"name": "distributorName", "label": "Distributor Name", "type": "text", "required": false},
  {"name": "labelOrArtist", "label": "Label/Artist Name", "type": "text", "required": false},
  {"name": "catalogDescription", "label": "Catalog Description", "type": "textarea", "required": false},
  {"name": "distributionFee", "label": "Distribution Fee (%)", "type": "number", "required": false},
  {"name": "paymentSchedule", "label": "Payment Schedule", "type": "text", "required": false},
  {"name": "platforms", "label": "Distribution Platforms", "type": "textarea", "required": false},
  {"name": "territory", "label": "Territory", "type": "text", "required": false},
  {"name": "term", "label": "Term Length", "type": "text", "required": false},
  {"name": "minimumCommitment", "label": "Minimum Release Commitment", "type": "text", "required": false},
  {"name": "terminationNotice", "label": "Termination Notice Period", "type": "text", "required": false}
]'::jsonb),

('work-for-hire', 'Work for Hire Agreement', 'Agreement where a creator produces work for another party who retains all rights to the creation.', 'Briefcase', 'Production', 10, '[
  {"name": "creatorName", "label": "Creator Name", "type": "text", "required": false},
  {"name": "hiringParty", "label": "Hiring Party", "type": "text", "required": false},
  {"name": "projectDescription", "label": "Project Description", "type": "textarea", "required": false},
  {"name": "deliverables", "label": "Deliverables", "type": "textarea", "required": false},
  {"name": "compensation", "label": "Compensation ($)", "type": "number", "required": false},
  {"name": "paymentSchedule", "label": "Payment Schedule", "type": "textarea", "required": false},
  {"name": "deadline", "label": "Delivery Deadline", "type": "date", "required": false},
  {"name": "revisions", "label": "Number of Revisions Included", "type": "number", "required": false},
  {"name": "creditRequirements", "label": "Credit Requirements", "type": "textarea", "required": false},
  {"name": "confidentiality", "label": "Confidentiality Terms", "type": "textarea", "required": false}
]'::jsonb),

('collaboration-agreement', 'Collaboration Agreement', 'Agreement between multiple artists or creators working together on a musical project.', 'Users', 'Collaboration', 10, '[
  {"name": "collaborator1", "label": "Collaborator 1 Name", "type": "text", "required": false},
  {"name": "collaborator2", "label": "Collaborator 2 Name", "type": "text", "required": false},
  {"name": "projectName", "label": "Project Name", "type": "text", "required": false},
  {"name": "ownershipSplit", "label": "Ownership Split (%)", "type": "text", "required": false},
  {"name": "royaltySplit", "label": "Royalty Split (%)", "type": "text", "required": false},
  {"name": "responsibilities", "label": "Responsibilities", "type": "textarea", "required": false},
  {"name": "decisionMaking", "label": "Decision Making Process", "type": "textarea", "required": false},
  {"name": "creditFormat", "label": "Credit Format", "type": "text", "required": false},
  {"name": "expenses", "label": "Expense Sharing", "type": "textarea", "required": false},
  {"name": "disputeResolution", "label": "Dispute Resolution", "type": "textarea", "required": false}
]'::jsonb),

('producer-agreement', 'Producer Agreement', 'Agreement between an artist and a music producer for the production of recordings.', 'Sliders', 'Production', 10, '[
  {"name": "producerName", "label": "Producer Name", "type": "text", "required": false},
  {"name": "artistName", "label": "Artist Name", "type": "text", "required": false},
  {"name": "projectTitle", "label": "Project Title", "type": "text", "required": false},
  {"name": "numberOfTracks", "label": "Number of Tracks", "type": "number", "required": false},
  {"name": "producerFee", "label": "Producer Fee ($)", "type": "number", "required": false},
  {"name": "royaltyPoints", "label": "Royalty Points (%)", "type": "number", "required": false},
  {"name": "advanceAmount", "label": "Advance Amount ($)", "type": "number", "required": false},
  {"name": "masterOwnership", "label": "Master Ownership (%)", "type": "number", "required": false},
  {"name": "deliveryFormat", "label": "Delivery Format", "type": "text", "required": false},
  {"name": "deadline", "label": "Delivery Deadline", "type": "date", "required": false}
]'::jsonb),

('sample-clearance', 'Sample Clearance Agreement', 'Agreement to legally use a portion of an existing recording in a new musical work.', 'Scissors', 'Licensing', 10, '[
  {"name": "originalOwner", "label": "Original Rights Owner", "type": "text", "required": false},
  {"name": "samplingArtist", "label": "Sampling Artist", "type": "text", "required": false},
  {"name": "originalSong", "label": "Original Song Title", "type": "text", "required": false},
  {"name": "newSong", "label": "New Song Title", "type": "text", "required": false},
  {"name": "sampleDescription", "label": "Sample Description", "type": "textarea", "required": false},
  {"name": "sampleDuration", "label": "Sample Duration (seconds)", "type": "number", "required": false},
  {"name": "upfrontFee", "label": "Upfront Fee ($)", "type": "number", "required": false},
  {"name": "royaltyRate", "label": "Royalty Rate (%)", "type": "number", "required": false},
  {"name": "territory", "label": "Territory", "type": "text", "required": false},
  {"name": "creditRequirement", "label": "Credit Requirement", "type": "textarea", "required": false}
]'::jsonb),

('merchandising-agreement', 'Merchandising Agreement', 'Agreement for the production and sale of merchandise featuring an artist''s name, likeness, or brand.', 'ShoppingBag', 'Merchandising', 10, '[
  {"name": "artistName", "label": "Artist/Band Name", "type": "text", "required": false},
  {"name": "merchandiserName", "label": "Merchandiser Name", "type": "text", "required": false},
  {"name": "productsDescription", "label": "Products Description", "type": "textarea", "required": false},
  {"name": "royaltyRate", "label": "Royalty Rate (%)", "type": "number", "required": false},
  {"name": "advanceAmount", "label": "Advance Amount ($)", "type": "number", "required": false},
  {"name": "minimumGuarantee", "label": "Minimum Guarantee ($)", "type": "number", "required": false},
  {"name": "territory", "label": "Territory", "type": "text", "required": false},
  {"name": "term", "label": "Term Length", "type": "text", "required": false},
  {"name": "approvalRights", "label": "Approval Rights", "type": "textarea", "required": false},
  {"name": "qualityStandards", "label": "Quality Standards", "type": "textarea", "required": false}
]'::jsonb),

('nda', 'Non-Disclosure Agreement (NDA)', 'Agreement to protect confidential information shared between parties in the music industry.', 'Lock', 'Legal', 10, '[
  {"name": "disclosingParty", "label": "Disclosing Party", "type": "text", "required": false},
  {"name": "receivingParty", "label": "Receiving Party", "type": "text", "required": false},
  {"name": "purpose", "label": "Purpose of Disclosure", "type": "textarea", "required": false},
  {"name": "confidentialInfo", "label": "Description of Confidential Information", "type": "textarea", "required": false},
  {"name": "term", "label": "Confidentiality Term", "type": "text", "required": false},
  {"name": "exclusions", "label": "Exclusions from Confidentiality", "type": "textarea", "required": false},
  {"name": "returnOfMaterials", "label": "Return of Materials Terms", "type": "textarea", "required": false},
  {"name": "jurisdiction", "label": "Governing Jurisdiction", "type": "text", "required": false},
  {"name": "remedies", "label": "Remedies for Breach", "type": "textarea", "required": false},
  {"name": "effectiveDate", "label": "Effective Date", "type": "date", "required": false}
]'::jsonb),

-- New 9 contracts from user''s PDFs
('master-producer-talent', 'Master Producer-Talent Agreement', 'Agreement between a master producer and artist/talent for production services, master rights, and royalty arrangements.', 'Mic2', 'Production', 10, '[
  {"name": "producerName", "label": "Producer Name", "type": "text", "required": false},
  {"name": "producerAddress", "label": "Producer Address", "type": "text", "required": false},
  {"name": "talentName", "label": "Talent/Artist Name", "type": "text", "required": false},
  {"name": "talentAddress", "label": "Talent Address", "type": "text", "required": false},
  {"name": "projectTitle", "label": "Project/Album Title", "type": "text", "required": false},
  {"name": "numberOfMasters", "label": "Number of Masters", "type": "number", "required": false},
  {"name": "masterFee", "label": "Master Fee per Track ($)", "type": "number", "required": false},
  {"name": "advanceAmount", "label": "Advance Amount ($)", "type": "number", "required": false},
  {"name": "producerRoyalty", "label": "Producer Royalty (%)", "type": "number", "required": false},
  {"name": "masterOwnership", "label": "Master Ownership Split (%)", "type": "text", "required": false},
  {"name": "deliveryDeadline", "label": "Delivery Deadline", "type": "date", "required": false},
  {"name": "creditRequirements", "label": "Credit Requirements", "type": "textarea", "required": false},
  {"name": "exclusivity", "label": "Exclusivity Terms", "type": "textarea", "required": false}
]'::jsonb),

('studio-time-contract', 'Studio Time Contract', 'Booking agreement for recording studio time including rates, equipment, engineer services, and studio policies.', 'Building', 'Recording', 10, '[
  {"name": "studioName", "label": "Studio Name", "type": "text", "required": false},
  {"name": "studioAddress", "label": "Studio Address", "type": "text", "required": false},
  {"name": "clientName", "label": "Client Name", "type": "text", "required": false},
  {"name": "clientContact", "label": "Client Contact Info", "type": "text", "required": false},
  {"name": "sessionDate", "label": "Session Date", "type": "date", "required": false},
  {"name": "startTime", "label": "Start Time", "type": "text", "required": false},
  {"name": "endTime", "label": "End Time", "type": "text", "required": false},
  {"name": "hourlyRate", "label": "Hourly Rate ($)", "type": "number", "required": false},
  {"name": "blockRate", "label": "Block Rate ($)", "type": "number", "required": false},
  {"name": "depositAmount", "label": "Deposit Amount ($)", "type": "number", "required": false},
  {"name": "engineerIncluded", "label": "Engineer Included", "type": "select", "options": ["Yes", "No", "Additional Fee"], "required": false},
  {"name": "equipmentProvided", "label": "Equipment Provided", "type": "textarea", "required": false},
  {"name": "cancellationPolicy", "label": "Cancellation Policy", "type": "textarea", "required": false}
]'::jsonb),

('artist-label-recording', 'Artist/Label Recording Agreement', 'Comprehensive recording contract between an artist and record label covering advances, royalties, masters, and release commitments.', 'Disc', 'Recording', 10, '[
  {"name": "artistName", "label": "Artist Name", "type": "text", "required": false},
  {"name": "artistAddress", "label": "Artist Address", "type": "text", "required": false},
  {"name": "labelName", "label": "Label Name", "type": "text", "required": false},
  {"name": "labelAddress", "label": "Label Address", "type": "text", "required": false},
  {"name": "initialTerm", "label": "Initial Term Length", "type": "text", "required": false},
  {"name": "optionPeriods", "label": "Option Periods", "type": "number", "required": false},
  {"name": "minAlbumCommitment", "label": "Minimum Album Commitment", "type": "number", "required": false},
  {"name": "recordingFund", "label": "Recording Fund ($)", "type": "number", "required": false},
  {"name": "advanceAmount", "label": "Advance Amount ($)", "type": "number", "required": false},
  {"name": "royaltyRate", "label": "Royalty Rate (%)", "type": "number", "required": false},
  {"name": "territorialRights", "label": "Territorial Rights", "type": "text", "required": false},
  {"name": "masterOwnership", "label": "Master Ownership", "type": "text", "required": false},
  {"name": "marketingCommitment", "label": "Marketing Commitment ($)", "type": "number", "required": false}
]'::jsonb),

('split-sheet', 'Split Sheet Agreement', 'Document establishing ownership percentages and royalty splits between songwriters, producers, and collaborators.', 'PieChart', 'Publishing', 10, '[
  {"name": "songTitle", "label": "Song Title", "type": "text", "required": false},
  {"name": "recordingDate", "label": "Recording Date", "type": "date", "required": false},
  {"name": "contributor1Name", "label": "Contributor 1 Name", "type": "text", "required": false},
  {"name": "contributor1Role", "label": "Contributor 1 Role", "type": "text", "required": false},
  {"name": "contributor1Split", "label": "Contributor 1 Split (%)", "type": "number", "required": false},
  {"name": "contributor1PRO", "label": "Contributor 1 PRO", "type": "text", "required": false},
  {"name": "contributor1IPI", "label": "Contributor 1 IPI Number", "type": "text", "required": false},
  {"name": "contributor2Name", "label": "Contributor 2 Name", "type": "text", "required": false},
  {"name": "contributor2Role", "label": "Contributor 2 Role", "type": "text", "required": false},
  {"name": "contributor2Split", "label": "Contributor 2 Split (%)", "type": "number", "required": false},
  {"name": "contributor2PRO", "label": "Contributor 2 PRO", "type": "text", "required": false},
  {"name": "contributor2IPI", "label": "Contributor 2 IPI Number", "type": "text", "required": false},
  {"name": "additionalContributors", "label": "Additional Contributors", "type": "textarea", "required": false},
  {"name": "publishingInfo", "label": "Publishing Information", "type": "textarea", "required": false}
]'::jsonb),

('llc-operating-agreement', 'LLC Operating Agreement', 'Operating agreement for a music label or entertainment company LLC covering ownership, management, and profit distribution.', 'Building2', 'Legal', 10, '[
  {"name": "companyName", "label": "Company/Label Name", "type": "text", "required": false},
  {"name": "stateOfFormation", "label": "State of Formation", "type": "text", "required": false},
  {"name": "principalAddress", "label": "Principal Address", "type": "text", "required": false},
  {"name": "formationDate", "label": "Formation Date", "type": "date", "required": false},
  {"name": "member1Name", "label": "Member 1 Name", "type": "text", "required": false},
  {"name": "member1Ownership", "label": "Member 1 Ownership (%)", "type": "number", "required": false},
  {"name": "member1Contribution", "label": "Member 1 Initial Contribution ($)", "type": "number", "required": false},
  {"name": "member2Name", "label": "Member 2 Name", "type": "text", "required": false},
  {"name": "member2Ownership", "label": "Member 2 Ownership (%)", "type": "number", "required": false},
  {"name": "member2Contribution", "label": "Member 2 Initial Contribution ($)", "type": "number", "required": false},
  {"name": "managementStructure", "label": "Management Structure", "type": "select", "options": ["Member-Managed", "Manager-Managed"], "required": false},
  {"name": "profitDistribution", "label": "Profit Distribution Terms", "type": "textarea", "required": false},
  {"name": "votingRights", "label": "Voting Rights", "type": "textarea", "required": false},
  {"name": "dissolution", "label": "Dissolution Terms", "type": "textarea", "required": false}
]'::jsonb),

('talent-release-form', 'Talent Release Form', 'Release form authorizing the use of a person''s name, image, voice, or likeness in recordings, videos, or promotional materials.', 'UserCheck', 'Legal', 10, '[
  {"name": "talentName", "label": "Talent Name", "type": "text", "required": false},
  {"name": "talentAddress", "label": "Talent Address", "type": "text", "required": false},
  {"name": "producerName", "label": "Producer/Company Name", "type": "text", "required": false},
  {"name": "projectTitle", "label": "Project Title", "type": "text", "required": false},
  {"name": "projectDescription", "label": "Project Description", "type": "textarea", "required": false},
  {"name": "recordingDate", "label": "Recording/Shoot Date", "type": "date", "required": false},
  {"name": "recordingLocation", "label": "Recording Location", "type": "text", "required": false},
  {"name": "compensationAmount", "label": "Compensation Amount ($)", "type": "number", "required": false},
  {"name": "usageRights", "label": "Usage Rights Granted", "type": "textarea", "required": false},
  {"name": "territory", "label": "Territory", "type": "text", "required": false},
  {"name": "termLength", "label": "Term Length", "type": "text", "required": false},
  {"name": "creditRequirements", "label": "Credit Requirements", "type": "textarea", "required": false}
]'::jsonb),

('artist-venue-agreement', 'Artist/Venue Performance Agreement', 'Comprehensive agreement between an artist and venue for live performances including technical requirements, hospitality, and payment terms.', 'MapPin', 'Performance', 10, '[
  {"name": "artistName", "label": "Artist/Band Name", "type": "text", "required": false},
  {"name": "artistContact", "label": "Artist Contact/Agent", "type": "text", "required": false},
  {"name": "venueName", "label": "Venue Name", "type": "text", "required": false},
  {"name": "venueAddress", "label": "Venue Address", "type": "text", "required": false},
  {"name": "venueCapacity", "label": "Venue Capacity", "type": "number", "required": false},
  {"name": "eventDate", "label": "Event Date", "type": "date", "required": false},
  {"name": "loadInTime", "label": "Load-In Time", "type": "text", "required": false},
  {"name": "soundcheckTime", "label": "Soundcheck Time", "type": "text", "required": false},
  {"name": "doorsTime", "label": "Doors Time", "type": "text", "required": false},
  {"name": "performanceTime", "label": "Performance Time", "type": "text", "required": false},
  {"name": "setLength", "label": "Set Length (minutes)", "type": "number", "required": false},
  {"name": "guarantee", "label": "Guarantee ($)", "type": "number", "required": false},
  {"name": "bonusStructure", "label": "Bonus Structure", "type": "textarea", "required": false},
  {"name": "ticketPrice", "label": "Ticket Price ($)", "type": "number", "required": false},
  {"name": "merchandiseTerms", "label": "Merchandise Terms", "type": "textarea", "required": false},
  {"name": "hospitalityRequirements", "label": "Hospitality/Rider", "type": "textarea", "required": false},
  {"name": "technicalRequirements", "label": "Technical Requirements", "type": "textarea", "required": false}
]'::jsonb),

('producer-composer-agreement', 'Producer/Composer Agreement', 'Agreement for commissioned music production or composition services including work-for-hire terms and creative specifications.', 'Music2', 'Production', 10, '[
  {"name": "composerName", "label": "Producer/Composer Name", "type": "text", "required": false},
  {"name": "composerAddress", "label": "Producer/Composer Address", "type": "text", "required": false},
  {"name": "clientName", "label": "Client Name", "type": "text", "required": false},
  {"name": "clientAddress", "label": "Client Address", "type": "text", "required": false},
  {"name": "projectTitle", "label": "Project Title", "type": "text", "required": false},
  {"name": "compositionDescription", "label": "Composition Description", "type": "textarea", "required": false},
  {"name": "genre", "label": "Genre/Style", "type": "text", "required": false},
  {"name": "duration", "label": "Duration Requirements", "type": "text", "required": false},
  {"name": "deliveryFormat", "label": "Delivery Format", "type": "text", "required": false},
  {"name": "compositionFee", "label": "Composition Fee ($)", "type": "number", "required": false},
  {"name": "paymentSchedule", "label": "Payment Schedule", "type": "textarea", "required": false},
  {"name": "revisionsIncluded", "label": "Revisions Included", "type": "number", "required": false},
  {"name": "deadline", "label": "Delivery Deadline", "type": "date", "required": false},
  {"name": "rightsGranted", "label": "Rights Granted", "type": "textarea", "required": false},
  {"name": "backendRoyalties", "label": "Backend Royalties (%)", "type": "number", "required": false}
]'::jsonb),

('video-release-form', 'Video Release Form', 'Release form for participants in music videos authorizing use of their likeness and performance in video productions.', 'Video', 'Legal', 10, '[
  {"name": "participantName", "label": "Participant Name", "type": "text", "required": false},
  {"name": "participantAddress", "label": "Participant Address", "type": "text", "required": false},
  {"name": "participantRole", "label": "Participant Role", "type": "text", "required": false},
  {"name": "productionCompany", "label": "Production Company", "type": "text", "required": false},
  {"name": "artistName", "label": "Artist Name", "type": "text", "required": false},
  {"name": "videoTitle", "label": "Video/Song Title", "type": "text", "required": false},
  {"name": "shootDate", "label": "Shoot Date", "type": "date", "required": false},
  {"name": "shootLocation", "label": "Shoot Location", "type": "text", "required": false},
  {"name": "compensation", "label": "Compensation ($)", "type": "number", "required": false},
  {"name": "usageRights", "label": "Usage Rights", "type": "textarea", "required": false},
  {"name": "territory", "label": "Territory", "type": "text", "required": false},
  {"name": "platforms", "label": "Distribution Platforms", "type": "textarea", "required": false},
  {"name": "creditProvided", "label": "Credit Provided", "type": "select", "options": ["Yes", "No"], "required": false},
  {"name": "term", "label": "Term", "type": "text", "required": false}
]'::jsonb)

ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  fields = EXCLUDED.fields,
  updated_at = NOW();

-- Create storage bucket for contract files if it doesn't exist
-- Note: This needs to be done via Supabase dashboard or API
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('contracts', 'contracts', false)
-- ON CONFLICT (id) DO NOTHING;
