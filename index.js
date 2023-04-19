const API_HOST = "https://mqtt.kiaofarming.com";
const API_VER = "v1";

const ATTR_DISABLED = "disabled";

function set_switch(dev_id, port, sw, cb) {
  let req_data = {};
  req_data[`port${port}`] = sw;

  $.ajax({
    url: `${API_HOST}/${API_VER}/controller/switch/${dev_id}`,
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    headers: {
      "Authorization": "Bearer {nTqOrlSptF156qc26duTSQhmuWFVA2RCeLCRRaenTb2}",
    },
    dataType: "json",
    data: req_data
  }).done(resp_data => {
    cb(resp_data);
  });
}

function get_device_id_validity(dev_id, ssid, cb) {
  let req_data = {};
  req_data["device_id"] = dev_id;
  req_data["ssid"] = ssid;

  $.ajax({
    url: `${API_HOST}/${API_VER}/utility/deviceIdValidity`,
    method: "GET",
    data: req_data,
    dataType: "json",
  }).done(resp_data => {
    cb(resp_data);
  });
}

window.onload = () => {
  let QrkNV_id = "QrkNV";
  let QrkNV_switch_port1 = $(`input[type=radio][name="${QrkNV_id}_switch_port1"]`);
  let QrkNV_switch_port2 = $(`input[type=radio][name="${QrkNV_id}_switch_port2"]`);

  let dev_switch = $(`input[type=radio][name="dev_switch"]`);
  let input_dev_id = $("#dev_id");
  let input_port = $("#port");
  let input_resp_msg = $("#resp_msg");

  let btn_validate = $("#btn_validate");
  let input_valid_msg = $("#valid_msg");

  QrkNV_switch_port1.on("change", function () {
    set_switch(QrkNV_id, 1, $(this).val(), console.log);
  });

  QrkNV_switch_port2.on("change", function () {
    set_switch(QrkNV_id, 2, $(this).val(), console.log);
  });

  function process_switch_response(resp) {
    dev_switch.removeAttr(ATTR_DISABLED);
    if (resp.status === undefined) { // Invalid response
      return;
    }

    console.log(resp);
    switch (resp.status) {
      case 200:
        input_resp_msg.html("設定開關成功");
        break;

      case 400:
        input_resp_msg.html("Bad Request");
        break;
      
      case 408:
        input_resp_msg.html("裝置回應逾時");
        break;

      case 500:
        input_resp_msg.html("API伺服器內部發生錯誤");
        break;

      default:
    }
  }

  dev_switch.on("change", function () {
    if (input_dev_id.val() === "") {
      input_resp_msg.html("Device ID不得為空白");
      return;
    }

    dev_switch.attr(ATTR_DISABLED, ATTR_DISABLED);
    input_resp_msg.html("等待API回應結果");
    set_switch(input_dev_id.val(), input_port.val(), $(this).val(), process_switch_response);
  });

  // verify ssid & device id
  btn_validate.on("click", () => {
    let v_dev_id = $("#valid_dev_id").val();
    let v_ssid = $("#valid_ssid").val();

    if (v_dev_id === "" || v_ssid === "") {
      input_valid_msg.html("Device ID & SSID不可為空");
      return;
    }

    input_valid_msg.html("等待API回應");
    btn_validate.attr(ATTR_DISABLED, ATTR_DISABLED);
    get_device_id_validity(v_dev_id, v_ssid, (resp) => {
      switch (resp.status) {
        case 200:
          input_valid_msg.html(`驗證結果: ${resp.valid ? "" : "不"}一致`);
          break;

        case 400:
          input_valid_msg.html("Bad Request");
          break;

        case 500:
          input_valid_msg.html("Server Internal Error");
          break;
      }

      btn_validate.removeAttr(ATTR_DISABLED);
    });
  });


  // Server-Send Event example
  let evt_src = new EventSource(`${API_HOST}/${API_VER}/notify`);

  //evt_src.onopen = (ev) => {
  //  console.log(ev);
  //}

  //evt_src.onmessage = (ev) => {
  //  //console.log(JSON.parse(ev.data));
  //  console.log(ev.data);
  //};

  //evt_src.onerror = (ev) => {
  //  console.log(ev);
  //}

  /* Common attribute (For all event data included)
     ssid: String
     device: String
     model: String
  */

  /* Device data attribue
      Common:
        serial:    Number
        timestamp: Number

      M101:
        temp:     Number
        humi:     Number
        light:    Number
        moisture: Number (Raw)

      M210 & M202
        flow:   Number
        switch: boolean array (alway one element) (true: on, false: off)
        port:   Number (always 1)

      M207
        switch: boolean array
        port:   Number
        flow:   Number
        mutex:  boolean

      M533
        moisture: Number array (always 3 elements) (data unit: percent)
  */

  /* Only init & online event included
      online: boolean (true: online, false: offline)
  */

  /* Only new & updated event included
      unsave: true (present for the data isn't stored at DB)
  */

  evt_src.addEventListener("init", (ev) => { // Return all device data array
    devs = JSON.parse(ev.data);
    console.log(devs);
  });

  evt_src.addEventListener("new", (ev) => { // Device send data first time.
    dev = JSON.parse(ev.data);
    console.log(`New Device: ${dev.ssid}`);
    console.log(dev);
  });

  evt_src.addEventListener("updated", (ev) => { // Device send updated data
    dev = JSON.parse(ev.data);
    console.log(`Device: ${dev.ssid} updated`);
    console.log(dev);
  });

  evt_src.addEventListener("online", (ev) => { //Device online status changed 
    dev = JSON.parse(ev.data);
    console.log(dev);
  });
};
