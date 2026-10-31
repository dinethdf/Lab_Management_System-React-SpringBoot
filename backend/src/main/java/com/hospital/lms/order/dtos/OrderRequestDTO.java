package com.hospital.lms.order.dtos;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequestDTO {
    private Long patientId;
    private List<Long> testIds;
}
