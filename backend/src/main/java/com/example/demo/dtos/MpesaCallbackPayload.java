package com.example.demo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor; /**
 * M-Pesa callback payload structure as sent by Safaricom.
 * IMPORTANT: This is the exact structure Safaricom sends.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MpesaCallbackPayload {
    private CallbackBody Body;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CallbackBody {
        private StkCallback stkCallback;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StkCallback {
        private String MerchantRequestID;
        private String CheckoutRequestID;
        private Integer ResultCode;      // 0 = success, non-zero = failure
        private String ResultDesc;
        private CallbackMetadata CallbackMetadata;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CallbackMetadata {
        private Item[] Item;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Item {
        private String Name;
        private String Value;
    }
}
