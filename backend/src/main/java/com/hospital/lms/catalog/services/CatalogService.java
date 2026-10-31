package com.hospital.lms.catalog.services;

import com.hospital.lms.catalog.dtos.CreateTestRequest;
import com.hospital.lms.catalog.dtos.TestDetailResponse;
import com.hospital.lms.catalog.dtos.TestResponse;
import com.hospital.lms.catalog.models.ContainerType;
import com.hospital.lms.catalog.models.LabTest;

import java.util.List;

public interface CatalogService {
    List<TestResponse> getAllTests();
    TestDetailResponse getTestById(Long id);
    LabTest createTest(CreateTestRequest request);
    LabTest updateTest(Long id, CreateTestRequest request);
    void setActiveStatus(Long id, boolean active);
    List<ContainerType> getAllContainerTypes();
}
