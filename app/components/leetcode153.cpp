#include <vector>
#include <iostream>

class Solution {
public:
    int findMin(std::vector<int>& nums) {
        int size = nums.size();

        int left = 0; 
        int right = size - 1; 

        while (left < right) {
            // because we would have found the answer when, left == right
            
            // compute mid 
            int mid = left + (right - left) / 2; 

            if(nums[mid] > nums[right]) {
                // if this condition is true, the minimum element would be on 
                // the right side 

                left = mid + 1;
            } else {
                right = mid;
            };
        };
        return nums[left]; // or we can also return nums[right]
    }
};

int main() {
    std::vector<int> nums = {4,5,6,7,0,1,2};
    Solution sol; 
    int result = sol.findMin(nums);
    std::cout << "The minimum element in the rotated sorted array is: " << result
}

// how do I install the C++ compiler and run this code?To install a C++ compiler and run the code, you can follow these steps:
