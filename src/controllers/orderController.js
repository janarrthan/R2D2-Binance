import Order from "../models/order.js";
import DatabaseError from "../utils/DatabaseError.js";

const createOrder = async (orderDetails) => {
  try {
    const order = new Order(orderDetails);
    await order.save();
    return order;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const getSignalOrders = async (signalId) => {
  try {
    const orders = await Order.find({ signalId: signalId }).populate({
      path: "userId",
      select: "userName email",
    });
    return orders;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findOrderByIdFullDetails = async (id) => {
  try {
    const orders = await Order.findById(id)
      .populate({
        path: "userId",
      })
      .populate({ path: "signalId" });
    return orders;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findOrders = async (search) => {
  try {
    const orders = await Order.find(search);
    return orders;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findOrdersFullDetails = async (search) => {
  try {
    const orders = await Order.find(search)
      .populate({
        path: "userId",
      })
      .populate({ path: "signalId" });
    return orders;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findOrdersWithUsersFullDetails = async (search) => {
  try {
    const orders = await Order.find(search).populate({
      path: "userId",
    });
    return orders;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const deleteOrder = async (id) => {
  try {
    const order = await Order.findByIdAndDelete(id);
    return order;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const deleteMany = async (signalId) => {
  try {
    const orders = await Order.deleteMany({ signalId: signalId });
    return orders;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const updateById = async (id, updates) => {
  try {
    return await Order.findByIdAndUpdate(id, updates);
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

export default {
  createOrder,
  findOrders,
  getSignalOrders,
  findOrderByIdFullDetails,
  deleteOrder,
  findOrdersFullDetails,
  findOrdersWithUsersFullDetails,
  deleteMany,
  updateById,
};
