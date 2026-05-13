import { useEffect, useRef, useState } from "react";
import { Home, PlusCircle, LayoutGrid, Lightbulb } from "lucide-react";
import { db } from "./firebase";
import "./App.css";
import { collection, addDoc } from "firebase/firestore";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

const pipelineStages = [
  "Researching",
  "Planned",
  "Need to Order",
  "Ordered",
  "Ready to Install",
  "Installed",
  "Completed",
];

function App() {
  const [cars, setCars] = useState(() => {
    try {
      const savedCars = localStorage.getItem("garageCars");
      return savedCars ? JSON.parse(savedCars) : [];
    } catch (error) {
      localStorage.removeItem("garageCars");
      return [];
    }
  });
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("list");
  const [draggedMod, setDraggedMod] = useState(null);
  const [carName, setCarName] = useState("");
  const [carType, setCarType] = useState("");
  const [carImage, setCarImage] = useState("");
  const [modName, setModName] = useState("");
  const [modCost, setModCost] = useState("");
  const [modCategory, setModCategory] = useState("Performance");
  const [modStatus, setModStatus] = useState("Planning");
  const [partNumber, setPartNumber] = useState("");
  const [partImage, setPartImage] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");

  const [editingIndex, setEditingIndex] = useState(null);
  
  const saveTestCar = async () => {
    try {
      await addDoc(collection(db, "testCars"), {
        name: "BMW 430i",
        created: new Date(),
      });

      console.log("Test car saved!");
    } catch (error) {
      console.error("Firebase save failed:", error);
    }
  };

  const [mobileTab, setMobileTab] = useState("garage");

  const [carBudget, setCarBudget] = useState("");

  const selectedCar = cars.find((car) => car.id === selectedCarId);

  const filteredMods =
    selectedCar?.mods
      .map((mod, originalIndex) => ({ ...mod, originalIndex }))
      .filter((mod) => statusFilter === "All" || mod.status === statusFilter) ||
    [];

  useEffect(() => {
    setSelectedCarId(null);
  }, []); 

  const handleAddCar = (e) => {
    e.preventDefault();

    const newCar = {
      id: Date.now(),
      name: carName,
      type: carType,
      image: carImage,
      mods: [],
    };

    setCars([...cars, newCar]);
    setCarName("");
    setCarType("");
    setCarImage("");
    setMobileTab("garage");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const register = async () => {
    try {
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Account created!");
    } catch (error) {
      alert(error.message);
    }
  };
  
  const login = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Logged in!");
    } catch (error) {
      alert(error.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const getTotalCost = (mods) => {
    return mods.reduce((total, mod) => total + Number(mod.cost || 0), 0);
  };

  const getProgress = (mods) => {
    if (mods.length === 0) return 0;

    const completed = mods.filter(
      (mod) => mod.status === "Installed" || mod.status === "Completed"
    ).length;

    return Math.round((completed / mods.length) * 100);
  };

  const resetForm = () => {
    setModName("");
    setModCost("");
    setModCategory("Performance");
    setModStatus("Researching");
    setPartNumber("");
    setPartImage("");
    setWebsite("");
    setNotes("");
    setEditingIndex(null);
    setModPriority("Medium");
  };

  const saveCarImage = () => {
    if (!selectedCar) return;

    const updatedCars = cars.map((car) =>
      car.id === selectedCar.id ? { ...car, image: carImage } : car
    );

    setCars(updatedCars);
    setCarImage("");
  };

  const saveMod = () => {
    if (!modName || !selectedCar) return;

    const updatedCars = cars.map((car) => {
      if (car.id !== selectedCar.id) return car;

      const modEntry = {
        name: modName,
        cost: Number(modCost || 0),
        category: modCategory,
        status: modStatus,
        partNumber,
        partImage,
        website,
        notes,
        priority: modPriority,
      };

      const updatedMods = [...car.mods];

      if (editingIndex !== null) {
        updatedMods[editingIndex] = modEntry;
      } else {
        updatedMods.push(modEntry);
      }

      return { ...car, mods: updatedMods };
    });

    setCars(updatedCars);
    resetForm();
  };

  const editMod = (index) => {
    const mod = selectedCar.mods[index];

    setModName(mod.name || "");
    setModCost(mod.cost || "");
    setModCategory(mod.category || "Performance");
    setModStatus(mod.status || "Researching");
    setPartNumber(mod.partNumber || "");
    setPartImage(mod.partImage || "");
    setWebsite(mod.website || "");
    setNotes(mod.notes || "");
    setEditingIndex(index);
    setViewMode("list");
    setModPriority(mod.priority || "Medium");
  };

  const deleteMod = (index) => {
    const updatedCars = cars.map((car) => {
      if (car.id !== selectedCar.id) return car;

      return {
        ...car,
        mods: car.mods.filter((_, modIndex) => modIndex !== index),
      };
    });

    setCars(updatedCars);
    resetForm();
  };

  const handleDrop = (newStatus) => {
    if (!draggedMod || !selectedCar) return;

    const updatedCars = cars.map((car) => {
      if (car.id !== selectedCar.id) return car;

      const updatedMods = car.mods.map((mod, index) => {
        if (index === draggedMod.originalIndex) {
          return { ...mod, status: newStatus };
        }

        return mod;
      });

      return { ...car, mods: updatedMods };
    });

    setCars(updatedCars);
    setDraggedMod(null);
  };

  const [modPriority, setModPriority] = useState("Medium");

  const priorityRank = {
    High: 1,
    Medium: 2,
    Low: 3,
  };

  const sortByPriority = (mods) => {
    return [...mods].sort(
      (a, b) =>
        (priorityRank[a.priority] || 2) - (priorityRank[b.priority] || 2)
    );
  };

  const getNextMod = (mods) => {
    const activeMods = mods.filter(
      (m) => m.status !== "Completed" && m.status !== "Installed"
    );

    if (activeMods.length === 0) return null;

    return sortByPriority(activeMods)[0];
  };

  const saveBudget = () => {
    if (!selectedCar) return;

    const updatedCars = cars.map((car) =>
      car.id === selectedCar.id
        ? { ...car, budget: Number(carBudget || 0) }
        : car
    );

    setCars(updatedCars);
    setCarBudget("");
  };

  const getSmartRecommendation = (mods) => {
    const activeMods = mods.filter(
      (mod) => mod.status !== "Installed" && mod.status !== "Completed"
    );

    if (activeMods.length === 0) return null;

    const statusRank = {
      Researching: 1,
      Planned: 2,
      "Need to Order": 3,
      Ordered: 4,
      "Ready to Install": 5,
    };

    return [...activeMods].sort((a, b) => {
      const priorityCompare =
        (priorityRank[a.priority] || 2) - (priorityRank[b.priority] || 2);

      if (priorityCompare !== 0) return priorityCompare;

      return (statusRank[b.status] || 0) - (statusRank[a.status] || 0);
    })[0];
  };

  const getActionPlan = (mods) => {
    const sort = (list) => sortByPriority(list)[0] || null;

    return {
      research: sort(mods.filter((m) => m.status === "Researching")),
      buy: sort(
        mods.filter(
          (m) => m.status === "Planned" || m.status === "Need to Order"
        )
      ),
      install: sort(
        mods.filter(
          (m) => m.status === "Ordered" || m.status === "Ready to Install"
        )
      ),
    };
  };

  const formRef = useRef(null);
  const pipelineRef = useRef(null);
  const planRef = useRef(null);

  const scrollTo = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const convertImageToBase64 = (file, callback) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 900;
        const scale = Math.min(maxWidth / img.width, 1);

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedImage = canvas.toDataURL("image/jpeg", 0.7);
        callback(compressedImage);
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  };

  <button onClick={saveTestCar}>
    Test Firebase Save
  </button>

  useEffect(() => {
    const saveCars = async () => {
      try {
        localStorage.setItem("garageCars", JSON.stringify(cars));

        await addDoc(collection(db, "garageCars"), {
          cars,
          savedAt: new Date(),
          source: "phone-test",
        });

        console.log("Cars saved to Firebase");
      } catch (error) {
        console.error("Save failed:", error);
      }
    };

    saveCars();
  }, []);

  return (
      
    <div className="app">
      <header className="hero">
        <p className="eyebrow">Busted Knuckles Garage</p>
        <h1>Build Tracker</h1>
        <p className="subtitle">
          Track the vision, money, parts, links, and progress behind every build.
        </p>
      </header>

      <div className="auth-bar">
        {!user ? (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={register}>
              Register
            </button>

            <button onClick={login}>
              Login
            </button>
          </>
        ) : (
          <div className="user-info">
            <span>{user.email}</span>

            <button onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>

      {!selectedCar ? (
        <>
          {mobileTab === "add" ? (
            <form className="add-car-form" onSubmit={handleAddCar}>
              <h2>Add Car</h2>
              <input
                type="text"
                placeholder="Vehicle name"
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                required
              />

              <input
                type="text"
                placeholder="Type (Daily, Project, etc)"
                value={carType}
                onChange={(e) => setCarType(e.target.value)}
              />

              <input
                type="text"
                placeholder="Image URL optional"
                value={carImage}
                onChange={(e) => setCarImage(e.target.value)}
              />

              <button type="submit">Save Car</button>
              <button type="button" onClick={() => setMobileTab("garage")}>
                Cancel
              </button>
            </form>
          ) : cars.length === 0 ? (
            <div className="empty-garage">
              <h2>No cars yet</h2>
              <p>Add your first car to start building your garage.</p>
              <button
                onClick={() => {
                  setMobileTab("add");
                  scrollTo(formRef);
                }}
              >
                Add Your First Car
              </button>
            </div>
          ) : (
            <div className="car-grid">
              {cars.map((car) => (
                <div key={car.id} className="car-card">
                  {car.image ? (
                    <img src={car.image} alt={car.name} className="car-image" />
                  ) : (
                    <div className="car-placeholder">No Image Added</div>
                  )}

                  <p className="eyebrow">{car.type}</p>
                  <h2>{car.name}</h2>

                  <div className="stat-row">
                    <div>
                      <span>{car.mods.length}</span>
                      <p>Mods</p>
                    </div>
                    
                    <div>
                      <span>${getTotalCost(car.mods).toLocaleString()}</span>
                      <p>Invested</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setSelectedCarId(car.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Open Build
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
          <main className="build-page">
            <button
              className="back-button"
              onClick={() => {
                setSelectedCarId(null);
                setStatusFilter("All");
                setViewMode("list");
                setDraggedMod(null);
                resetForm();
              }}
            >
              ← Garage
            </button>

            <section className="build-header">
              {selectedCar.image ? (
                <img
                  src={selectedCar.image}
                  alt={selectedCar.name}
                  className="build-hero-image"
                />
              ) : (
                <div className="build-hero-placeholder">
                  Add a car photo below
                </div>
              )}

              <p className="eyebrow">{selectedCar.type}</p>
              <h2>{selectedCar.name}</h2>

              <div className="image-input-row">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    convertImageToBase64(file, (imageData) => {
                      setCarImage(imageData);
                    });
                  }}
                />

                <button onClick={saveCarImage}>Save Image</button>
              </div>

              <div className="stat-row wide">
                <div>
                  <span>{selectedCar.mods.length}</span>
                  <p>Total Mods</p>
                </div>
              </div>
              <div className="budget-box">
                <div>
                  <p>Budget</p>
                  <span>${selectedCar.budget ? selectedCar.budget.toLocaleString() : "0"}</span>
                </div>

                <div>
                  <p>Remaining</p>
                  <span
                    className={
                      Number(selectedCar.budget) - getTotalCost(selectedCar.mods) < 0
                        ? "over-budget"
                        : "under-budget"
                    }
                  >
                    $
                    {(
                      Number(selectedCar.budget || 0) - getTotalCost(selectedCar.mods)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </section>

            <div ref={planRef}>
              {selectedCar && (
                <div className="action-plan">
                  <p className="eyebrow">Build Plan</p>

                  {getActionPlan(selectedCar.mods).research && (
                    <div className="plan-item">
                      <span>🔍 Research</span>
                      <p>{getActionPlan(selectedCar.mods).research.name}</p>
                    </div>
                  )}

                  {getActionPlan(selectedCar.mods).buy && (
                    <div className="plan-item">
                      <span>🛒 Buy</span>
                      <p>{getActionPlan(selectedCar.mods).buy.name}</p>
                    </div>
                  )}
                  {getActionPlan(selectedCar.mods).install && (
                    <div className="plan-item">
                      <span>🔧 Install</span>
                      <p>{getActionPlan(selectedCar.mods).install.name}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="image-input-row">
              <input
                value={carBudget}
                onChange={(e) => setCarBudget(e.target.value)}
                placeholder="Set build Budget"
                type="number"
              />
              <button onClick={saveBudget}>Save Budget</button>
            </div>

            <div>
              <span>${getTotalCost(selectedCar.mods).toLocaleString()}</span>
              <p>Total Invested</p>
            </div>

            <section>
              <div className="progress-section">
                <p>Build Progress</p>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${getProgress(selectedCar.mods)}%` }}
                  ></div>
                </div>

                {selectedCar && getNextMod(selectedCar.mods) && (
                  <div className="next-up">
                    <p className="eyebrow">Next Up</p>

                    <h3>{getNextMod(selectedCar.mods).name}</h3>

                    <span className="status-pill">
                      {getNextMod(selectedCar.mods).status}
                    </span>

                    <span
                      className={`priority-pill ${getNextMod(selectedCar.mods).priority?.toLowerCase() || "medium"
                        }`}
                    >
                      {getNextMod(selectedCar.mods).priority || "Medium"} Priority
                    </span>
                  </div>
                )}

                <span>{getProgress(selectedCar.mods)}%</span>
              </div>
            </section>

            <section className="form-box" ref={formRef}>
              <h3>
                {editingIndex !== null ? "Update Build Item" : "Add Build Item"}
              </h3>

              <label>Item</label>
              <input
                value={modName}
                onChange={(e) => setModName(e.target.value)}
                placeholder="AWE axle-back exhaust, lowering springs, rotors..."
              />

              <label>Cost</label>
              <input
                type="number"
                value={modCost}
                onChange={(e) => setModCost(e.target.value)}
                placeholder="850"
              />

              <div className="form-grid">
                <div>
                  <label>Category</label>
                  <select
                    value={modCategory}
                    onChange={(e) => setModCategory(e.target.value)}
                  >
                    <option>Performance</option>
                    <option>Exterior</option>
                    <option>Interior</option>
                    <option>Suspension</option>
                    <option>Wheels/Tires</option>
                    <option>Brakes</option>
                    <option>Maintenance</option>
                    <option>Audio/Electronics</option>
                  </select>
                </div>

                <div>
                  <label>Status</label>
                  <select
                    value={modStatus}
                    onChange={(e) => setModStatus(e.target.value)}
                  >
                    <option value="Researching">Researching</option>
                    <option value="Planned">Planned</option>
                    <option value="Need to Order">Need to Order</option>
                    <option value="Ordered">Ordered</option>
                    <option value="Ready to Install">Ready to Install</option>
                    <option value="Installed">Installed</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label>Priority</label>
                  <select
                    value={modPriority}
                    onChange={(e) => setModPriority(e.target.value)}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>

              <label>Part Number</label>
              <input
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="Example: 34116888457"
              />

              <label>Part Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  convertImageToBase64(file, (imageData) => {
                    setPartImage(imageData);
                  });
                }}
              />

              <label>Website / Vendor Link</label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />

              <label>Notes / Comments</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Fitment notes, why you want it, install concerns, etc."
              />

              <button onClick={saveMod}>
                {editingIndex !== null ? "Save Changes" : "Add to Build"}
              </button>
            </section>

            <section className="mod-list" ref={pipelineRef}>
              <div className="section-heading">
                <h3>Build Sheet</h3>

                {viewMode === "list" && (
                  <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option>All</option>
                    {pipelineStages.map((stage) => (
                      <option key={stage}>{stage}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="view-toggle">
                <button onClick={() => setViewMode("list")}>List</button>
                <button onClick={() => setViewMode("pipeline")}>Pipeline</button>
              </div>

              {viewMode === "list" ? (
                selectedCar.mods.length === 0 ? (
                  <p className="empty-state">No build items yet.</p>
                ) : filteredMods.length === 0 ? (
                  <p className="empty-state">No items match this filter.</p>
                ) : (
                  pipelineStages.map((stage) => {
                    const stageMods = sortByPriority(
                      filteredMods.filter((mod) => mod.status === stage)
                    );

                    if (stageMods.length === 0) return null;

                    return (
                      <div key={stage} className="list-group">
                        <h4 className="list-group-title">{stage}</h4>

                        {stageMods.map((mod) => (
                          <div key={mod.originalIndex} className="mod-item">
                            <div className="mod-topline">
                              <div>
                                <h3>{mod.name}</h3>
                                <p>{mod.category || "N/A"}</p>
                              </div>

                              <span className="price">
                                ${Number(mod.cost || 0).toLocaleString()}
                              </span>
                            </div>

                            <span className="status-pill">{mod.status}</span>

                            <span className={`priority-pill ${mod.priority?.toLowerCase() || "medium"}`}>
                              {mod.priority || "Medium"} Priority
                            </span>

                            <div className="action-row">
                              <button onClick={() => editMod(mod.originalIndex)}>Edit</button>
                              <button onClick={() => deleteMod(mod.originalIndex)}>Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })
                )
              ) : selectedCar.mods.length === 0 ? (
                <p className="empty-state">No build items yet.</p>
              ) : (
                <div className="pipeline">
                  {pipelineStages.map((stage) => {
                    const stageMods = sortByPriority(
                      selectedCar.mods
                        .map((mod, originalIndex) => ({ ...mod, originalIndex }))
                        .filter((mod) => mod.status === stage)
                    );

                    return (
                      <div
                        key={stage}
                        className="pipeline-column"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(stage)}
                      >
                        <h4>{stage}</h4>

                        {stageMods.length === 0 ? (
                          <p className="pipeline-empty">No items</p>
                        ) : (
                          stageMods.map((mod) => (
                            <div
                              key={mod.originalIndex}
                              className="pipeline-card"
                              draggable
                              onDragStart={() => setDraggedMod(mod)}
                            >
                              {mod.partImage && (
                                <img
                                  src={mod.partImage}
                                  alt={mod.name}
                                  className="pipeline-card-image"
                                />
                              )}

                              <p>{mod.name}</p>
                              <small>{mod.category || "N/A"}</small>

                              <span>
                                ${Number(mod.cost || 0).toLocaleString()}
                              </span>

                              {mod.partNumber && (
                                <small>Part #: {mod.partNumber}</small>
                              )}

                              <div className="pipeline-actions">
                                <button onClick={() => editMod(mod.originalIndex)}>
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteMod(mod.originalIndex)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
      )}
          <nav className="app-nav">
            <button
              className={mobileTab === "garage" ? "active" : ""}
              onClick={() => {
                setMobileTab("garage");
                setSelectedCarId(null);
                setViewMode("list");
              }}
            >
              <Home size={18} />
              <span>Garage</span>
            </button>

            <button
              className={mobileTab === "add" ? "active" : ""}
              onClick={() => {
                setMobileTab("add");
                scrollTo(formRef);
              }}
            >
              <PlusCircle size={18} />
              <span>Add</span>
            </button>

            <button
              className={mobileTab === "pipeline" ? "active" : ""}
              onClick={() => {
                setMobileTab("pipeline");
                setViewMode("pipeline");
                setTimeout(() => scrollTo(pipelineRef), 100);
              }}
            >
              <LayoutGrid size={18} />
              <span>Pipeline</span>
            </button>

            <button
              className={mobileTab === "plan" ? "active" : ""}
              onClick={() => {
                setMobileTab("plan");
                scrollTo(planRef);
              }}
            >
              <Lightbulb size={18} />
              <span>Plan</span>
            </button>
          </nav>
        </div>
      );
}

export default App;