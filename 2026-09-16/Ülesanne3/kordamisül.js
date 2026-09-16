const users = [
  { id: 1, name: "Mari", age: 22, active: true, address: { city: "Tallinn" } },
  { id: 2, name: "Jüri", age: 17, active: false },
  { id: 3, name: "Kati", age: 31, active: true },
  { id: 4, name: "Martin", age: 19, active: false },
  { id: 5, name: "Laura", age: 26, active: true }
];

users.forEach((user) => {
  console.log(user.name);
});
console.log("");

const activeUsers = users.filter((user) => user.active === true);
console.log(activeUsers);
console.log("");

const adultUsers = users.filter((user) => user.age >= 18);
console.log(adultUsers);
console.log("");

const onlyNames = users.map((user) => user.name);
console.log(onlyNames);
console.log("");

const foundUser = users.find((user) => user.id === 3);
console.log(foundUser);
console.log("");

function getUserStatus(user) {
  if (user.active) {
    return "Aktiivne";
  }
  return "Mitteaktiivne";
}

console.log(getUserStatus(users[0]));
console.log("");

const getGreeting = (user) =>
  `Tere, ${user.name}! Sa oled ${user.age} aastat vana.`;

console.log(getGreeting(users[0]));
console.log("");

const { name, age } = users[0];
console.log(name);
console.log(age);
console.log("");

const newUser = { id: 6, name: "Karl", age: 24, active: true };
const updatedUsers = [...users, newUser];
console.log(updatedUsers);
console.log("");

users.forEach((user) => {
  const city = user.address?.city ?? "Linn puudub";
  console.log(`${user.name}: ${city}`);
});
console.log("");

users.forEach((user) => {
  const status = user.active ? "Aktiivne" : "Mitteaktiivne";
  console.log(`${user.name} – ${status}`);
});
console.log("");

const sortedByAge = [...users].sort((a, b) => a.age - b.age);

sortedByAge.forEach((user) => {
  console.log(`${user.name}: ${user.age}`);
});