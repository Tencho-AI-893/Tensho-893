#!/usr/bin/env python3
"""
Backend API Test Suite for DJ Senoh Moment Music Experience App
Tests all backend endpoints with realistic data
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://23cf99dc-fba3-40c7-9e55-dca2b27567ca.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class BackendTester:
    def __init__(self):
        self.test_results = []
        self.festival_id = None
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        })
    
    def test_festivals_list(self):
        """Test GET /api/festivals endpoint"""
        try:
            response = requests.get(f"{API_BASE}/festivals", timeout=10)
            
            if response.status_code == 200:
                festivals = response.json()
                if isinstance(festivals, list) and len(festivals) > 0:
                    # Store festival ID for later tests
                    self.festival_id = festivals[0].get('id')
                    
                    # Validate festival structure
                    festival = festivals[0]
                    required_fields = ['id', 'name', 'year', 'location', 'date', 'venue_info', 'sound_system', 'family_services', 'ticket_info']
                    
                    missing_fields = [field for field in required_fields if field not in festival]
                    if missing_fields:
                        self.log_test("Festival List API", False, f"Missing required fields: {missing_fields}")
                        return
                    
                    # Check if it's the expected Moment Festival
                    if festival['name'] == "Moment Festival" and festival['year'] == 2025:
                        self.log_test("Festival List API", True, f"Successfully retrieved {len(festivals)} festival(s) with complete data structure")
                    else:
                        self.log_test("Festival List API", False, f"Unexpected festival data: {festival['name']} {festival['year']}")
                else:
                    self.log_test("Festival List API", False, "Empty festivals list returned")
            else:
                self.log_test("Festival List API", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Festival List API", False, f"Request failed: {str(e)}")
    
    def test_festival_detail(self):
        """Test GET /api/festivals/{festival_id} endpoint"""
        if not self.festival_id:
            self.log_test("Festival Detail API", False, "No festival ID available from previous test")
            return
            
        try:
            response = requests.get(f"{API_BASE}/festivals/{self.festival_id}", timeout=10)
            
            if response.status_code == 200:
                festival = response.json()
                
                # Validate detailed festival data
                if festival.get('name') == "Moment Festival":
                    # Check venue info
                    venue_info = festival.get('venue_info', {})
                    if venue_info.get('name') == "フォレスト・イン洞川":
                        # Check sound system
                        sound_system = festival.get('sound_system', {})
                        if sound_system.get('primary') == "Alcons Audio":
                            # Check family services
                            family_services = festival.get('family_services', [])
                            if len(family_services) >= 4:
                                # Check ticket info
                                ticket_info = festival.get('ticket_info', {})
                                expected_tickets = ['early_bird', 'regular', 'vip', 'family']
                                if all(ticket in ticket_info for ticket in expected_tickets):
                                    self.log_test("Festival Detail API", True, "Festival detail retrieved with complete venue, sound, family services, and ticket information")
                                else:
                                    self.log_test("Festival Detail API", False, f"Missing ticket types. Expected: {expected_tickets}, Got: {list(ticket_info.keys())}")
                            else:
                                self.log_test("Festival Detail API", False, f"Insufficient family services. Expected: 4+, Got: {len(family_services)}")
                        else:
                            self.log_test("Festival Detail API", False, f"Incorrect sound system. Expected: Alcons Audio, Got: {sound_system.get('primary')}")
                    else:
                        self.log_test("Festival Detail API", False, f"Incorrect venue. Expected: フォレスト・イン洞川, Got: {venue_info.get('name')}")
                else:
                    self.log_test("Festival Detail API", False, f"Incorrect festival name. Expected: Moment Festival, Got: {festival.get('name')}")
            else:
                self.log_test("Festival Detail API", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Festival Detail API", False, f"Request failed: {str(e)}")
    
    def test_dj_profile(self):
        """Test GET /api/dj-profile endpoint"""
        try:
            response = requests.get(f"{API_BASE}/dj-profile", timeout=10)
            
            if response.status_code == 200:
                profile = response.json()
                
                # Validate DJ profile structure
                required_fields = ['name', 'stage_name', 'location', 'music_styles', 'career_start', 'bio', 'philosophy', 'timeline', 'social_links']
                missing_fields = [field for field in required_fields if field not in profile]
                
                if missing_fields:
                    self.log_test("DJ Profile API", False, f"Missing required fields: {missing_fields}")
                    return
                
                # Validate specific DJ Senoh data
                if profile.get('stage_name') == "DJ Senoh" and profile.get('name') == "Mike Senoh":
                    # Check philosophy structure
                    philosophy = profile.get('philosophy', {})
                    expected_philosophy = ['meditation', 'awareness', 'permanence']
                    if all(key in philosophy for key in expected_philosophy):
                        # Check timeline
                        timeline = profile.get('timeline', [])
                        if len(timeline) >= 6:  # Should have 6 timeline entries
                            # Check social links
                            social_links = profile.get('social_links', {})
                            expected_socials = ['soundcloud', 'facebook', 'instagram', 'twitter']
                            if all(social in social_links for social in expected_socials):
                                self.log_test("DJ Profile API", True, f"DJ profile retrieved with complete philosophy, {len(timeline)} timeline entries, and all social links")
                            else:
                                self.log_test("DJ Profile API", False, f"Missing social links. Expected: {expected_socials}, Got: {list(social_links.keys())}")
                        else:
                            self.log_test("DJ Profile API", False, f"Insufficient timeline entries. Expected: 6+, Got: {len(timeline)}")
                    else:
                        self.log_test("DJ Profile API", False, f"Missing philosophy elements. Expected: {expected_philosophy}, Got: {list(philosophy.keys())}")
                else:
                    self.log_test("DJ Profile API", False, f"Incorrect DJ data. Expected: DJ Senoh/Mike Senoh, Got: {profile.get('stage_name')}/{profile.get('name')}")
            else:
                self.log_test("DJ Profile API", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("DJ Profile API", False, f"Request failed: {str(e)}")
    
    def test_nft_moments(self):
        """Test GET /api/nft-moments endpoint"""
        try:
            response = requests.get(f"{API_BASE}/nft-moments", timeout=10)
            
            if response.status_code == 200:
                nfts = response.json()
                
                if isinstance(nfts, list) and len(nfts) >= 3:
                    # Validate NFT structure
                    nft = nfts[0]
                    required_fields = ['id', 'title', 'description', 'image_base64', 'moment_timestamp', 'rarity', 'attributes']
                    missing_fields = [field for field in required_fields if field not in nft]
                    
                    if missing_fields:
                        self.log_test("NFT Moments API", False, f"Missing required fields: {missing_fields}")
                        return
                    
                    # Check for expected NFTs
                    nft_titles = [nft['title'] for nft in nfts]
                    expected_titles = ["Sunrise Moment #001", "Forest Echo #002", "Unity Flow #003"]
                    
                    if all(title in nft_titles for title in expected_titles):
                        # Validate image data format
                        valid_images = all(nft['image_base64'].startswith('data:image/svg+xml;base64,') for nft in nfts)
                        if valid_images:
                            # Check rarity system
                            rarities = [nft['rarity'] for nft in nfts]
                            expected_rarities = ['legendary', 'rare', 'common']
                            if all(rarity in expected_rarities for rarity in rarities):
                                self.log_test("NFT Moments API", True, f"Retrieved {len(nfts)} NFT moments with valid base64 SVG images and rarity system")
                            else:
                                self.log_test("NFT Moments API", False, f"Invalid rarity values. Expected: {expected_rarities}, Got: {rarities}")
                        else:
                            self.log_test("NFT Moments API", False, "Invalid image format - not base64 encoded SVG")
                    else:
                        self.log_test("NFT Moments API", False, f"Missing expected NFTs. Expected: {expected_titles}, Got: {nft_titles}")
                else:
                    self.log_test("NFT Moments API", False, f"Insufficient NFT data. Expected: 3+, Got: {len(nfts) if isinstance(nfts, list) else 'not a list'}")
            else:
                self.log_test("NFT Moments API", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("NFT Moments API", False, f"Request failed: {str(e)}")
    
    def test_ticket_reservation(self):
        """Test POST /api/ticket-reservation endpoint"""
        if not self.festival_id:
            self.log_test("Ticket Reservation API", False, "No festival ID available for reservation test")
            return
            
        # Test data for ticket reservation
        reservation_data = {
            "festival_id": self.festival_id,
            "name": "田中太郎",
            "email": "tanaka.taro@example.com",
            "phone": "090-1234-5678",
            "ticket_type": "early_bird",
            "quantity": 2
        }
        
        try:
            response = requests.post(
                f"{API_BASE}/ticket-reservation",
                json=reservation_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                reservation = response.json()
                
                # Validate reservation response
                required_fields = ['id', 'festival_id', 'name', 'email', 'phone', 'ticket_type', 'quantity', 'total_price', 'status']
                missing_fields = [field for field in required_fields if field not in reservation]
                
                if missing_fields:
                    self.log_test("Ticket Reservation API", False, f"Missing required fields in response: {missing_fields}")
                    return
                
                # Validate price calculation (early_bird: 15000 * 2 = 30000)
                expected_price = 15000 * 2
                if reservation['total_price'] == expected_price:
                    # Validate other fields
                    if (reservation['name'] == reservation_data['name'] and
                        reservation['email'] == reservation_data['email'] and
                        reservation['ticket_type'] == reservation_data['ticket_type'] and
                        reservation['quantity'] == reservation_data['quantity'] and
                        reservation['status'] == 'pending'):
                        self.log_test("Ticket Reservation API", True, f"Ticket reservation created successfully with correct price calculation (¥{reservation['total_price']})")
                    else:
                        self.log_test("Ticket Reservation API", False, "Reservation data mismatch in response")
                else:
                    self.log_test("Ticket Reservation API", False, f"Incorrect price calculation. Expected: ¥{expected_price}, Got: ¥{reservation['total_price']}")
            else:
                self.log_test("Ticket Reservation API", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Ticket Reservation API", False, f"Request failed: {str(e)}")
    
    def test_ticket_reservation_validation(self):
        """Test ticket reservation validation with invalid data"""
        # Test with invalid festival ID
        invalid_reservation = {
            "festival_id": "invalid-festival-id",
            "name": "テストユーザー",
            "email": "test@example.com",
            "phone": "090-0000-0000",
            "ticket_type": "regular",
            "quantity": 1
        }
        
        try:
            response = requests.post(
                f"{API_BASE}/ticket-reservation",
                json=invalid_reservation,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 404:
                self.log_test("Ticket Reservation Validation", True, "Correctly rejected reservation with invalid festival ID (404)")
            else:
                self.log_test("Ticket Reservation Validation", False, f"Expected 404 for invalid festival ID, got {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Ticket Reservation Validation", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 80)
        print("DJ SENOH MOMENT MUSIC EXPERIENCE - BACKEND API TEST SUITE")
        print("=" * 80)
        print(f"Testing backend at: {BACKEND_URL}")
        print(f"API base URL: {API_BASE}")
        print("-" * 80)
        
        # Run tests in logical order
        self.test_festivals_list()
        self.test_festival_detail()
        self.test_dj_profile()
        self.test_nft_moments()
        self.test_ticket_reservation()
        self.test_ticket_reservation_validation()
        
        # Summary
        print("-" * 80)
        print("TEST SUMMARY:")
        print("-" * 80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status} {result['test']}")
        
        print("-" * 80)
        print(f"TOTAL: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! Backend APIs are working correctly.")
            return True
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return False

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)