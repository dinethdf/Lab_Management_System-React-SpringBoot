import api from './api';
import { API_URLS } from '../constants';

/**
 * Service for interacting with the Phlebotomy & Sample Collection backend endpoints.
 */
export const collectionService = {
  /**
   * Looks up an order and its specimen container slots by Lab Slip barcode (LS-YYYY-NNNNN).
   * @param {string} barcode e.g. "LS-2026-00045"
   */
  getCollectionOrder: async (barcode) => {
    const response = await api.get(`${API_URLS.COLLECTION_ORDER}/${encodeURIComponent(barcode.trim())}`);
    return response.data;
  },

  /**
   * Allocates a 4-digit sticker set code (e.g. "0001") to an ordered test,
   * automatically generating and matching all container codes (e.g. FBC-0001-P1).
   * @param {number} orderTestId ID of the ordered test
   * @param {string} setCode e.g. "0001" or "1"
   */
  allocateSet: async (orderTestId, setCode) => {
    const response = await api.post(`/collection/order-tests/${orderTestId}/allocate-set`, {
      setCode,
    });
    return response.data;
  },

  /**
   * Marks an individual container as COLLECTED by tube code (e.g. "FBC-0001-P1") or container ID.
   * @param {string} tubeCode e.g. "FBC-0001-P1"
   * @param {number} containerId (optional)
   */
  collectTube: async (tubeCode, containerId) => {
    const response = await api.post('/collection/collect-tube', {
      tubeCode,
      containerId,
    });
    return response.data;
  },

  /**
   * Links a pre-printed sticker code (SC00001 format) to an open container slot.
   * @param {number} containerId ID of the container slot
   * @param {string} stickerCode e.g. "SC00021"
   */
  linkSticker: async (containerId, stickerCode) => {
    const response = await api.post(API_URLS.COLLECTION_LINK, {
      containerId,
      stickerCode: stickerCode.trim().toUpperCase(),
    });
    return response.data;
  },

  /**
   * Marks a collected container as RECEIVED_AT_LAB.
   * @param {number} containerId ID of the collected container
   */
  receiveContainer: async (containerId) => {
    const response = await api.post(`${API_URLS.COLLECTION_RECEIVE}/${containerId}`);
    return response.data;
  },

  /**
   * Bulk marks all collected containers for an order as RECEIVED_AT_LAB.
   * @param {number} orderId ID of the order
   */
  receiveAllCollected: async (orderId) => {
    const response = await api.post(`${API_URLS.COLLECTION_RECEIVE_ALL}/${orderId}`);
    return response.data;
  },

  /**
   * Rejects a specimen container at bench receipt due to quality defect (hemolyzed, clotted, etc.).
   * @param {number} containerId ID of the container
   * @param {string} reason Written rejection explanation
   */
  rejectContainer: async (containerId, reason) => {
    const response = await api.post(`${API_URLS.COLLECTION_REJECT}/${containerId}`, {
      reason,
    });
    return response.data;
  },

  /**
   * Retrieves recent pending collection orders for the phlebotomy room worklist.
   */
  getPendingOrders: async () => {
    const response = await api.get(API_URLS.COLLECTION_PENDING);
    return response.data;
  },
};

export default collectionService;
