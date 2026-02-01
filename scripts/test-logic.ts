
import { checkCandidateInterviewStatus } from '../lib/services/candidate-service';
import { Candidate, Interview } from '../lib/types';

// Mock objects
const mockInterview: Interview = {
  id: '1',
  title: 'Test Interview',
  jd_name: 'JD',
  created_at: new Date().toISOString(),
  status: 'Active',
  end_time: undefined // defaults to created_at + 24h
};

const mockCandidate: Candidate = {
  id: 'c1',
  name: 'John',
  usn: '123',
  status: 'Pending',
  resume_status: 'Passed',
  interview_status: 'Not Started',
  manually_promoted: false,
  override_by_admin: false,
  created_at: new Date().toISOString()
};

async function runTests() {
  console.log("Running Status Logic Tests...");

  // Test 1: Active Window
  const res1 = await checkCandidateInterviewStatus(mockCandidate, mockInterview);
  console.log(`Test 1 (Active Window): Expected ACTIVE, Got ${res1.status}. Reason: ${res1.reason || ''}`);

  // Test 2: Expired Window
  const expiredInterview = { ...mockInterview, end_time: new Date(Date.now() - 3600000).toISOString() }; // 1 hour ago
  const res2 = await checkCandidateInterviewStatus(mockCandidate, expiredInterview);
  console.log(`Test 2 (Expired Window): Expected EXPIRED, Got ${res2.status}. Reason: ${res2.reason || ''}`);

  // Test 3: Admin Override on Expired
  const promotedCandidate = { ...mockCandidate, manually_promoted: true };
  const res3 = await checkCandidateInterviewStatus(promotedCandidate, expiredInterview);
  console.log(`Test 3 (Admin Promote on Expired): Expected ACTIVE/COMPLETED, Got ${res3.status}. Reason: ${res3.reason || ''}`);

  // Test 4: Re-Enable on Expired
  const reEnabledCandidate = { 
    ...mockCandidate, 
    override_by_admin: true, 
    manual_interview_deadline: new Date(Date.now() + 3600000).toISOString() // +1 hour
  };
  const res4 = await checkCandidateInterviewStatus(reEnabledCandidate, expiredInterview);
  console.log(`Test 4 (Re-Enable on Expired): Expected ACTIVE, Got ${res4.status}. Reason: ${res4.reason || ''}`);

  console.log("Tests Completed.");
}

runTests().catch(console.error);
