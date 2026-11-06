import { Router } from "express";

import userController from "../controllers/userController.js";
import channelController from "../controllers/channelController.js";
import strategyController from "../controllers/strategyController.js";

import auth from "../middleware/auth.js";
import apiAuth from "../middleware/api-auth.js";

const router = Router();

// ==================================== Views routes =========================
router.get("/users", auth, async (req, res) => {
  const channels = await channelController.getChannels();
  res.render("users", { channels: channels, error: req.query.error });
});

// =================================== Api Routes ========================
// Get all users
router.get("/api/users", apiAuth, async (req, res) => {
  try {
    const users = await userController.getAllUsers();
    res.json({ success: true, data: users });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// Find a user
router.get("/api/users/:id", apiAuth, async (req, res) => {
  try {
    const user = await userController.findById(req.params.id);

    if (!user) {
      return res.json({ success: false, message: "No user found!" });
    }

    const tradingStrategyText = await tradingStrategyListToString(user.tradingStrategies);

    res.json({ success: true, data: { userData: user, tradingStrategyText } });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// Create a user
router.post("/api/users", apiAuth, async (req, res) => {
  try {
    const newStrategyList = await filterTradingStrategyList(req.body.tradingStrategies);

    if (newStrategyList.error) {
      return res.json({ success: false, message: newStrategyList.error });
    }

    req.body.tradingStrategies = newStrategyList;
    const user = await userController.createUser(req.body);
    res.send({ success: true, data: "User added successfully!" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
});

// Update a user
router.patch("/api/users/:id", apiAuth, async (req, res) => {
  try {
    const newStrategyList = await filterTradingStrategyList(req.body.tradingStrategies);

    if (newStrategyList.error) {
      return res.json({ success: false, message: newStrategyList.error });
    }

    req.body.tradingStrategies = newStrategyList;
    const user = await userController.updateUser(req.params.id, req.body);
    res.send({ success: true, data: user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Delete a user
router.delete("/api/users/:id", apiAuth, async (req, res) => {
  try {
    const user = await userController.deleteUser(req.params.id);

    if (!user) {
      return res.json({ success: false, message: "No user found!" });
    }

    res.json({ success: true, data: user });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

const filterTradingStrategyList = async (tradingStrategies) => {
  const strategies = await strategyController.findManyByName(tradingStrategies.map((str) => str.strategyName));

  if (strategies.length !== tradingStrategies.length) {
    return { error: "Unable to add user. Invalid Trading Strategy List." };
  }

  const newStrategyList = [];

  for (var i = 0; i < tradingStrategies.length; i++) {
    const strategy = tradingStrategies[i];
    const dbStrategy = strategies.find((str) => str.strategyName == strategy.strategyName);
    newStrategyList.push({
      strategyId: dbStrategy._id,
      strategyAmount: strategy.strategyAmount,
    });
  }

  return newStrategyList;
};

const tradingStrategyListToString = async (tradingStrategies) => {
  const strategies = await strategyController.findManyByIds(tradingStrategies.map((str) => str.strategyId));

  var strategiesText = "";

  for (var i = 0; i < strategies.length; i++) {
    const dbStrategy = strategies[i];
    const userStrategy = tradingStrategies.find((str) => str.strategyId.toString() == dbStrategy._id.toString());

    if (i !== strategies.length - 1) {
      strategiesText += `[${dbStrategy.strategyName}] =*= [${userStrategy.strategyAmount}] \n`;
    } else {
      strategiesText += `[${dbStrategy.strategyName}] =*= [${userStrategy.strategyAmount}]`;
    }
  }

  return strategiesText;
};

export default router;
