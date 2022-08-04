const createNewPostHandler = (db, uniqid, st) => (req, res) => {
  const {
    title,
    description,
    thumbnail,
    price,
    location,
    catogery,
    subcatogery,
    adid,
    supercatogery,
    tags,
    property_type,
    furnishing,
    bedrooms,
    construction_status,
    listedby,
    maintenance,
    total_floors,
    floor_no,
    car_parking,
    facing,
    project_name,
    bathrooms,
    washrooms,
    meals_included,
    search_for,
    roommate_for,
    brand,
    model,
    fuel,
    transmission,
    KmDriver,
    salary_period,
    job_position,
    processor,
    ram,
    graphics_type,
    graphics_storage,
    storage_type,
    storage,
    monitor_included,
    included_acc,
    screen_size,
    monitor_type,
    camera,
    battery,
    os,
    printer_type,
    display_size,
    published_year,
    author,
    pet_gender,
    used_months,
    used_years,
    screen_l_size,
    year,
    parts_type,
    seller,
    vehicle_brand,
    mobile,
    lattitude,
    longitude,
  } = req.body;
  uniqadid = uniqid.process(seller + price);

  console.log(thumbnail);

  db.transaction((trx) =>
    trx
      .insert({
        geo: st.geomFromText(`Point(${lattitude} ${longitude})`, 4326),
        lat: lattitude,
        long: longitude,
        title: title,
        description: description,
        thumbnail: thumbnail,
        price: price,
        address: location,
        catogery: catogery,
        subcatogery: subcatogery,
        adid: uniqadid,
        property_type: property_type,
        furnishing: furnishing,
        bedroom: bedrooms,
        construction_status: construction_status,
        listed_by: listedby,
        maintenance: maintenance,
        total_floors: total_floors,
        floor_no: floor_no,
        car_parking: car_parking,
        facing: facing,
        project_name: project_name,
        bathrooms: bathrooms,
        washrooms: washrooms,
        meals_included: meals_included,
        search_for: search_for,
        roommate_for: roommate_for,
        brand: brand,
        model: model,
        fuel: fuel,
        transmission: transmission,
        km_driven: KmDriver,
        salary_period: salary_period,
        job_position: job_position,
        processor: processor,
        ram: ram,
        graphics_name: graphics_type,
        graphics_storage: graphics_storage,
        storage_type: storage_type,
        storage: storage,
        monitor_included: monitor_included,
        accss_included: included_acc,
        screen_size: screen_size,
        monitor_type: monitor_type,
        camera: camera,
        battery: battery,
        os: os,
        printer_type: printer_type,
        book_year: published_year,
        pet_gender: pet_gender,
        tags: tags,
        supercatogery: supercatogery,
        seller: seller,
        status: "active",
        mobile: mobile,
      })
      .into("archive")
      .returning("supercatogery")
      .then((ReturnSuper) => {
        console.log("returning", ReturnSuper);
        if (ReturnSuper[0] === "houseapartment") {
          return trx("houseapartment")
            .insert({
              product_id: uniqadid,
              property_type: property_type,
              furnishing: furnishing,
              bedrooms: bedrooms,
              bathrooms: bathrooms,
              construction_status: construction_status,
              listed_by: listedby,
              super_buildup_area: super_buildup_area,
              carpet_area: carpet_area,
              maintenance: maintenance,
              total_floors: total_floors,
              floor_no: floor_no,
              car_parking: car_parking,
              facing: facing,
              project_name: project_name,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "shopeoffice") {
          return trx("shopeoffice")
            .insert({
              product_id: uniqadid,
              construction_status: construction_status,
              listed_by: listedby,
              furnishing: furnishing,
              washrooms: washrooms,
              super_buildup_area: super_buildup_area,
              carpet_area: carpet_area,
              maintenance: maintenance,
              floor_no: floor_no,
              car_parking: car_parking,
              facing: facing,
              project_name: project_name,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "landplot") {
          return trx("landplot")
            .insert({
              product_id: uniqadid,
              listed_by: listedby,
              plot_area: plot_area,
              length: length,
              breadth: breadth,
              facing: facing,
              project_name: project_name,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "payingguesthouse") {
          return trx("payingguesthouse")
            .insert({
              product_id: uniqadid,
              listed_by: listedby,
              plot_area: plot_area,
              length: length,
              breadth: breadth,
              facing: facing,
              project_name: project_name,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "roommate") {
          return trx("roommate")
            .insert({
              product_id: uniqadid,
              listed_by: listedby,
              furnishing: furnishing,
              meals_included: meals_included,
              searching_for: search_for,
              roommate_for: roommate_for,
              roommate_age: roommate_age,
              car_parking: car_parking,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "carvehicle") {
          return trx("carvehicle")
            .insert({
              product_id: uniqadid,
              brand: vehicle_brand,
              model: model,
              year: year,
              fuel: fuel,
              transmission: transmission,
              km_driven: KmDriver,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "sphareparts") {
          return trx("sphareparts")
            .insert({
              product_id: uniqadid,
              parts_type: parts_type,
              transmission: transmission,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "regular") {
          return trx("regular")
            .insert({
              product_id: uniqadid,
              used_months: used_months,
              used_years: used_years,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "jobs") {
          return trx("jobs")
            .insert({
              product_id: uniqadid,
              salary_period: salary_period,
              position: job_position,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "pclaptop") {
          return trx("pclaptop")
            .insert({
              product_id: uniqadid,
              processor: processor,
              ram: ram,
              storage: storage,
              storage_type: storage_type,
              graphics_type: graphics_type,
              graphics_storage: graphics_storage,
              monitor_included: monitor_included,
              screen_size: screen_l_size,
              included_acc: included_acc,
              used_years: used_years,
              used_months: used_months,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "cpu") {
          return trx("cpu")
            .insert({
              product_id: uniqadid,
              processor: processor,
              ram: ram,
              storage: storage,
              storage_type: storage_type,
              graphics_type: graphics_type,
              graphics_storage: graphics_storage,
              used_years: used_years,
              used_months: used_months,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "monitor") {
          return trx("monitor")
            .insert({
              product_id: uniqadid,
              used_months: used_months,
              used_years: used_years,
              monitor_size: screen_size,
              monitor_type: monitor_type,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "withbrand") {
          return trx("withbrand")
            .insert({
              product_id: uniqadid,
              brand_id: brand,
              used_months: used_months,
              used_years: used_years,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "tvs") {
          return trx("tvs")
            .insert({
              product_id: uniqadid,
              brand_id: brand,
              display_size: screen_size,
              tv_type: monitor_type,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "mobiletablet") {
          return trx("mobiletablet")
            .insert({
              product_id: uniqadid,
              brand: brand,
              used_months: used_months,
              used_years: used_years,
              display_size: screen_size,
              processor: processor,
              ram: ram,
              storage: storage,
              camera: camera,
              battery: battery,
              operating_system: os,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "twowheeler") {
          return trx("twowheeler")
            .insert({
              product_id: uniqadid,
              brand: vehicle_brand,
              model: model,
              year: year,
              km_driven: KmDriver,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "books") {
          return trx("books")
            .insert({
              product_id: uniqadid,
              published_year: published_year,
              author: author,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "cloths") {
          return trx("cloths")
            .insert({
              product_id: uniqadid,
              cloth_size: cloth_size,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else if (ReturnSuper[0] === "pets") {
          return trx("pets")
            .insert({
              product_id: uniqadid,
              pet_age_months: pet_age_months,
              pet_age_years: pet_age_years,
              pet_gender: pet_gender,
            })
            .then((response) => {
              db("productviews")
                .insert({
                  adid: uniqadid,
                })
                .then((ress) => {
                  db("productlike")
                    .insert({
                      adid: uniqadid,
                    })
                    .then((ress) => {
                      res.json(uniqadid);
                    });
                });
            });
        } else {
          res.json(uniqadid);
        }
      })
  );
};

const DeletePostHandler = (db) => (req, res) => {
  const { adid, username } = req.body;
  db("productlike")
    .where("adid", adid)
    .del()
    .then((res1) =>
      db("productviews")
        .where("adid", adid)
        .del()
        .then((res2) => {
          db("productimage")
            .where("adid", adid)
            .del()
            .then((res3) => {
              db("archive")
                .where("adid", adid)
                .del()
                .then((res4) => {
                  db.select(
                    "title",
                    "thumbnail",
                    "price",
                    "supercatogery",
                    "address",
                    "status",
                    "adid"
                  )
                    .from("archive")
                    .where("seller", req.body.username)
                    .then((response) => res.json(response))
                    .catch((err) =>
                      res.status(400).json("Im unable to get response.")
                    );
                });
            });
        })
    )
    .catch((err) => res.status(400).json("unable to delete"));
};
module.exports = {
  createNewPostHandler: createNewPostHandler,
  DeletePostHandler: DeletePostHandler,
};
