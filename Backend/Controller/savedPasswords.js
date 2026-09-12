const { default: mongoose } = require("mongoose");
const { Password } = require("../Model/savedPasswords");
const { encrypt, tryDecrypt } = require("../utils/crypto");
const { validateCreateVault } = require("../utils/validate");

async function createFields(req, res) {
  const { service, email, password } = req.body;

  const validation = validateCreateVault({ service, email, password });
  if (!validation.valid) {
    return res.status(400).json({ message: validation.errors[0] });
  }

  const trimmedService = service.trim();
  const trimmedEmail = email.trim();

  const available = await Password.findOne({
    service: trimmedService,
    email: trimmedEmail,
    createdBy: req.user._id,
  });
  if (available) {
    return res.status(409).json({ message: "Given data is already present" });
  }

  await Password.create({
    email: trimmedEmail,
    service: trimmedService,
    password: encrypt(password),
    createdBy: req.user._id,
  });
  return res.status(201).json({ message: "Saved Password Success" });
}

async function renderPasswords(req, res) {
  const allPasswords = await Password.find({ createdBy: req.user._id });
  if (!allPasswords || allPasswords.length === 0) {
    return res.json({ passwords: [] });
  }
  const passwords = allPasswords.map((entry) => {
    const doc = entry.toObject();
    return {
      ...doc,
      password: tryDecrypt(doc.password) ?? doc.password,
    };
  });
  return res.json({ passwords });
}

async function deleteField(req, res) {
  const id = req.params.id;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Give a valid Id" });
  }
  const del = await Password.findOneAndDelete({
    _id: id,
    createdBy: req.user._id,
  });
  if (!del) return res.status(404).json({ message: "Password not found" });
  return res.json({ message: "Delete Success" });
}

async function updateField(req, res) {
  const id = req.params.id;
  const { service, email, password } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Give a valid Id" });
  }

  const validation = validateCreateVault({ service, email, password });
  if (!validation.valid) {
    return res.status(400).json({ message: validation.errors[0] });
  }

  try {
    const updated = await Password.findOneAndUpdate(
      { _id: id, createdBy: req.user._id },
      {
        service: service.trim(),
        email: email.trim(),
        password: encrypt(password),
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Password not found" });
    }
    return res.json({
      message: "Password updated successfully",
      updated,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update password" });
  }
}

module.exports = { renderPasswords, createFields, deleteField, updateField }